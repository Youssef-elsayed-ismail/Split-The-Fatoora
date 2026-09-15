import { ExtractedReceiptSchema, SYSTEM_PROMPT } from '../receiptSchema.ts'
import { OcrError, type OcrImage, type OcrProvider, type RawReceipt } from './provider.ts'

/** A receipt photo is a single page; extraction never needs a long response. */
const MAX_TOKENS = 4096
const DEFAULT_BASE_URL = 'https://agentrouter.org'
const DEFAULT_MODEL = 'claude-opus-4-8'

type AgentRouterResponse = {
  stop_reason?: string
  content?: Array<{ type?: string; text?: string }>
}

function getApiKey(): string {
  const key =
    process.env.AGENTROUTER_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN ?? process.env.ANTHROPIC_API_KEY ?? ''
  if (!key) {
    throw new OcrError(
      'bad_credentials',
      'AGENTROUTER_API_KEY is not set. Add your AgentRouter key to api.env.',
      500,
      false,
    )
  }
  return key
}

function parseJsonResponse(response: AgentRouterResponse): RawReceipt {
  const text = response.content?.find((block) => block.type === 'text')?.text?.trim()
  if (!text) throw new OcrError('unparsable', 'Could not make sense of that image as a receipt.', 422)

  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return ExtractedReceiptSchema.parse(JSON.parse(json))
  } catch {
    throw new OcrError('unparsable', 'The receipt reader returned invalid structured data.', 422)
  }
}

/** Reads receipts with Claude vision through AgentRouter's Anthropic-compatible API. */
export const claudeOcrProvider: OcrProvider = {
  name: 'claude',

  async read({ base64, mediaType }: OcrImage): Promise<RawReceipt> {
    const baseUrl = (
      process.env.AGENTROUTER_BASE_URL ?? process.env.ANTHROPIC_BASE_URL ?? DEFAULT_BASE_URL
    ).replace(/\/$/, '')
    const model = process.env.AGENTROUTER_MODEL ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
    let response: Response

    try {
      response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${getApiKey()}`,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          system: `${SYSTEM_PROMPT}\n\nReturn only valid JSON matching this exact shape: {"restaurantName":"","date":"yyyy-mm-dd","items":[{"name":"","price":0}],"subtotal":0,"vat":0,"taxes":0,"serviceCharge":0,"otherCharges":0,"total":0}`,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: 'Read this receipt.' },
            ],
          }],
        }),
      })
    } catch (error) {
      if (error instanceof OcrError) throw error
      throw new OcrError('network_error', 'Could not reach the receipt reader.')
    }

    if (response.status === 401 || response.status === 403) {
      throw new OcrError('bad_credentials', 'AgentRouter rejected the API key.', 500, false)
    }
    if (response.status === 429) {
      throw new OcrError('rate_limited', 'Too many receipts at once. Try again shortly.', 429)
    }
    if (!response.ok) {
      const details = await response.text()
      throw new OcrError('upstream_error', `AgentRouter returned an error: ${details}`)
    }

    const payload = (await response.json()) as AgentRouterResponse
    if (payload.stop_reason === 'refusal') {
      throw new OcrError('refused', 'The reader declined to process this image.', 422, false)
    }
    if (payload.stop_reason === 'max_tokens') {
      throw new OcrError(
        'too_long',
        'That receipt has more lines than can be read in one go. Try a closer photo, or enter it by hand.',
      )
    }

    return parseJsonResponse(payload)
  },
}
