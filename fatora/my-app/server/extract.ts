import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { ExtractedReceiptSchema, SYSTEM_PROMPT, type ExtractedReceipt } from './receiptSchema.ts'

/** Image types the Messages API accepts. */
export const SUPPORTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number]

export function isSupportedMediaType(value: string): value is SupportedMediaType {
  return (SUPPORTED_MEDIA_TYPES as readonly string[]).includes(value)
}

/** A receipt photo is a single page; extraction never needs a long response. */
const MAX_TOKENS = 4096

export class ExtractionError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 502) {
    super(message)
    this.name = 'ExtractionError'
    this.code = code
    this.status = status
  }
}

let client: Anthropic | null = null

/** Built lazily so a missing key surfaces as a request error, not a boot crash. */
function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

/**
 * Reads a receipt image with Claude and returns the printed figures.
 *
 * The response shape is constrained by the Zod schema via structured outputs, so
 * the result is already validated by the time it gets back here.
 */
export async function extractReceiptFromImage(
  imageBase64: string,
  mediaType: SupportedMediaType,
): Promise<ExtractedReceipt> {
  let response

  try {
    response = await getClient().messages.parse({
      model: 'claude-opus-5',
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      output_config: {
        // Extraction is transcription, not reasoning; medium keeps cost and
        // latency down without hurting accuracy on a legible receipt.
        effort: 'medium',
        format: zodOutputFormat(ExtractedReceiptSchema),
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: 'Read this receipt.' },
          ],
        },
      ],
    })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ExtractionError(
        'bad_credentials',
        'The server’s Anthropic API key was rejected. Check ANTHROPIC_API_KEY.',
        500,
      )
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new ExtractionError('rate_limited', 'Too many receipts at once. Try again shortly.', 429)
    }
    if (error instanceof Anthropic.APIError) {
      throw new ExtractionError('upstream_error', `Claude returned an error: ${error.message}`)
    }
    throw new ExtractionError('network_error', 'Could not reach Claude to read the receipt.')
  }

  if (response.stop_reason === 'refusal') {
    throw new ExtractionError('refused', 'Claude declined to read this image.', 422)
  }

  if (response.stop_reason === 'max_tokens') {
    throw new ExtractionError(
      'too_long',
      'That receipt has more lines than can be read in one go. Try a closer photo, or enter it by hand.',
    )
  }

  if (!response.parsed_output) {
    throw new ExtractionError('unparsable', 'Could not make sense of that image as a receipt.', 422)
  }

  return response.parsed_output
}
