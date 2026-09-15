import { ExtractedReceiptSchema, SYSTEM_PROMPT } from '../receiptSchema.ts'
import { OcrError, type OcrImage, type OcrProvider, type RawReceipt } from './provider.ts'

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const MAX_TOKENS = 4096

const RECEIPT_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    restaurantName: { type: 'STRING' },
    date: { type: 'STRING' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          price: { type: 'NUMBER' },
        },
        required: ['name', 'price'],
      },
    },
    subtotal: { type: 'NUMBER' },
    vat: { type: 'NUMBER' },
    taxes: { type: 'NUMBER' },
    serviceCharge: { type: 'NUMBER' },
    otherCharges: { type: 'NUMBER' },
    total: { type: 'NUMBER' },
  },
  required: [
    'restaurantName',
    'date',
    'items',
    'subtotal',
    'vat',
    'taxes',
    'serviceCharge',
    'otherCharges',
    'total',
  ],
} as const

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string
    content?: { parts?: Array<{ text?: string }> }
  }>
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''
  if (!key) {
    throw new OcrError(
      'bad_credentials',
      'GEMINI_API_KEY is not set. Add a Gemini API key to api.env.',
      500,
      false,
    )
  }
  return key
}

function parseResponse(payload: GeminiResponse): RawReceipt {
  const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text?.trim()
  if (!text) throw new OcrError('unparsable', 'Could not make sense of that image as a receipt.', 422)

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const json = start >= 0 && end > start ? text.slice(start, end + 1) : text
  try {
    const value = JSON.parse(json) as Record<string, unknown>
    const taxes = Array.isArray(value.taxes)
      ? value.taxes.reduce((sum, entry) => {
          if (typeof entry === 'number') return sum + entry
          if (entry && typeof entry === 'object' && typeof (entry as { amount?: unknown }).amount === 'number') {
            return sum + (entry as { amount: number }).amount
          }
          return sum
        }, 0)
      : value.taxes ?? 0
    const parsed = ExtractedReceiptSchema.safeParse({
      ...value,
      restaurantName: value.restaurantName ?? value.merchantName ?? '',
      vat: value.vat ?? value.vatAmount ?? 0,
      taxes,
      subtotal: value.subtotal ?? 0,
      serviceCharge: value.serviceCharge ?? 0,
      otherCharges: value.otherCharges ?? 0,
      total: value.total ?? 0,
    })
    if (!parsed.success) {
      console.error('[gemini] invalid receipt fields', parsed.error.issues)
      throw new Error('schema mismatch')
    }
    return parsed.data
  } catch {
    throw new OcrError('unparsable', 'The Gemini reader returned invalid structured data.', 422)
  }
}

export const geminiOcrProvider: OcrProvider = {
  name: 'gemini',

  async read({ base64, mediaType }: OcrImage): Promise<RawReceipt> {
    const baseUrl = (process.env.GEMINI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL
    const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(getApiKey())}`
    let response: Response

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: mediaType, data: base64 } },
              { text: 'Read this receipt. Return only valid JSON with the requested fields.' },
            ],
          }],
          generationConfig: {
            maxOutputTokens: MAX_TOKENS,
            responseMimeType: 'application/json',
            responseSchema: RECEIPT_RESPONSE_SCHEMA,
          },
        }),
      })
    } catch {
      throw new OcrError('network_error', 'Could not reach the Gemini receipt reader.')
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new OcrError('bad_credentials', 'Gemini rejected the API key or request.', 500, false)
    }
    if (response.status === 429) {
      throw new OcrError('rate_limited', 'Too many receipts at once. Try again shortly.', 429)
    }
    if (!response.ok) {
      throw new OcrError('upstream_error', `Gemini returned an error: ${await response.text()}`)
    }

    const payload = (await response.json()) as GeminiResponse
    const finishReason = payload.candidates?.[0]?.finishReason
    if (finishReason === 'MAX_TOKENS') {
      throw new OcrError('too_long', 'That receipt has more lines than can be read in one go.')
    }
    if (finishReason === 'SAFETY') {
      throw new OcrError('refused', 'Gemini declined to process this image.', 422, false)
    }

    return parseResponse(payload)
  },
}