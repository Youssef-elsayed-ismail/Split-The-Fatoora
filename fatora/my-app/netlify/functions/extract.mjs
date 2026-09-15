import { randomUUID } from 'node:crypto'
import {
  getOcrProvider,
  isSupportedMediaType,
  OcrError,
  validateRawReceipt,
} from '../../server/ocr/index.ts'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.4)

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(payload),
  }
}

export const config = {
  path: '/api/extract',
}

export default async function handler(req) {
  if (req.httpMethod !== 'POST') {
    return json(405, {
      error: { code: 'method_not_allowed', message: 'Use POST.', retryable: false },
    })
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '')

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return json(413, {
      error: {
        code: 'too_large',
        message: 'That image is too large. Keep it under 8 MB.',
        retryable: false,
      },
    })
  }

  try {
    const parsed = rawBody ? JSON.parse(rawBody) : {}
    const { imageBase64, mediaType } = parsed ?? {}

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return json(400, {
        error: { code: 'bad_request', message: 'imageBase64 is required.', retryable: false },
      })
    }

    if (typeof mediaType !== 'string' || !isSupportedMediaType(mediaType)) {
      return json(415, {
        error: {
          code: 'unsupported_type',
          message: 'That file type cannot be read. Use a JPEG, PNG, WebP or GIF.',
          retryable: false,
        },
      })
    }

    const provider = getOcrProvider()
    const transcribed = await provider.read({ base64: imageBase64, mediaType })
    const { receipt, warnings, complete } = validateRawReceipt(
      transcribed,
      () => `item-${randomUUID()}`,
    )

    return json(200, {
      receipt,
      extraction: { provider: provider.name, complete, warnings },
    })
  } catch (error) {
    if (error instanceof OcrError) {
      if (error.status >= 500) {
        console.error(`[ocr] ${error.code}: ${error.message}`)
      }
      return json(error.status, {
        error: { code: error.code, message: error.message, retryable: error.retryable },
      })
    }

    console.error('[ocr] unexpected', error)
    return json(500, {
      error: {
        code: 'internal_error',
        message: 'Something went wrong reading the receipt.',
        retryable: true,
      },
    })
  }
}
