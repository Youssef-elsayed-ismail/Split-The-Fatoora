import { randomUUID } from 'node:crypto'
import {
  getOcrProvider,
  isSupportedMediaType,
  OcrError,
  validateRawReceipt,
} from '../server/ocr/index.ts'

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.4)

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json(
        {
          error: {
            code: 'method_not_allowed',
            message: 'Use POST.',
            retryable: false,
          },
        },
        { status: 405 },
      )
    }

    try {
      const contentLength = Number(
        request.headers.get('content-length') ?? '0',
      )

      if (contentLength > MAX_BODY_BYTES) {
        return Response.json(
          {
            error: {
              code: 'too_large',
              message: 'That image is too large. Keep it under 3 MB.',
              retryable: false,
            },
          },
          { status: 413 },
        )
      }

      const rawBody = await request.text()

      if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
        return Response.json(
          {
            error: {
              code: 'too_large',
              message: 'That image is too large. Keep it under 3 MB.',
              retryable: false,
            },
          },
          { status: 413 },
        )
      }

      const parsed = JSON.parse(rawBody) as {
        imageBase64?: unknown
        mediaType?: unknown
      }

      const { imageBase64, mediaType } = parsed

      if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
        return Response.json(
          {
            error: {
              code: 'bad_request',
              message: 'imageBase64 is required.',
              retryable: false,
            },
          },
          { status: 400 },
        )
      }

      if (
        typeof mediaType !== 'string' ||
        !isSupportedMediaType(mediaType)
      ) {
        return Response.json(
          {
            error: {
              code: 'unsupported_type',
              message:
                'That file type cannot be read. Use a JPEG, PNG, WebP or GIF.',
              retryable: false,
            },
          },
          { status: 415 },
        )
      }

      const provider = getOcrProvider()

      const transcribed = await provider.read({
        base64: imageBase64,
        mediaType,
      })

      const { receipt, warnings, complete } = validateRawReceipt(
        transcribed,
        () => `item-${randomUUID()}`,
      )

      return Response.json({
        receipt,
        extraction: {
          provider: provider.name,
          complete,
          warnings,
        },
      })
    } catch (error) {
      if (error instanceof OcrError) {
        if (error.status >= 500) {
          console.error(
            `[ocr] ${error.code}: ${error.message}`,
          )
        }

        return Response.json(
          {
            error: {
              code: error.code,
              message: error.message,
              retryable: error.retryable,
            },
          },
          { status: error.status },
        )
      }

      console.error('[ocr] unexpected', error)

      return Response.json(
        {
          error: {
            code: 'internal_error',
            message: 'Something went wrong reading the receipt.',
            retryable: true,
          },
        },
        { status: 500 },
      )
    }
  },
}