import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { getOcrProvider, isSupportedMediaType, OcrError, validateRawReceipt } from './ocr/index.ts'

export const EXTRACT_PATH = '/api/extract'

/** Base64 inflates by ~4/3, so this keeps requests well inside the API's 32 MB limit. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.4)

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new OcrError('too_large', 'That image is too large. Keep it under 8 MB.', 413, false))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  })
  res.end(body)
}

/**
 * POST /api/extract — `{ imageBase64, mediaType }` in, `{ receipt, extraction }` out.
 *
 * A thin read-then-validate pipeline: the provider transcribes, the validator decides
 * what is usable. An incomplete read is a 200 with warnings, not an error — the app
 * shows Receipt Review either way and the user edits from there.
 *
 * Framework-free so the same handler serves the Vite dev server and production.
 */
export async function handleExtract(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { code: 'method_not_allowed', message: 'Use POST.' } })
    return
  }

  try {
    const raw = await readBody(req)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new OcrError('bad_request', 'Body must be JSON.', 400, false)
    }

    const { imageBase64, mediaType } = (parsed ?? {}) as {
      imageBase64?: unknown
      mediaType?: unknown
    }

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      throw new OcrError('bad_request', 'imageBase64 is required.', 400, false)
    }
    if (typeof mediaType !== 'string' || !isSupportedMediaType(mediaType)) {
      throw new OcrError(
        'unsupported_type',
        'That file type cannot be read. Use a JPEG, PNG, WebP or GIF.',
        415,
        false,
      )
    }

    const provider = getOcrProvider()
    const transcribed = await provider.read({ base64: imageBase64, mediaType })

    // Ids belong to this app, not to the provider, so they are minted here.
    const { receipt, warnings, complete } = validateRawReceipt(
      transcribed,
      () => `item-${randomUUID()}`,
    )

    sendJson(res, 200, {
      receipt,
      extraction: { provider: provider.name, complete, warnings },
    })
  } catch (error) {
    if (error instanceof OcrError) {
      if (error.status >= 500) console.error(`[ocr] ${error.code}: ${error.message}`)
      sendJson(res, error.status, {
        error: { code: error.code, message: error.message, retryable: error.retryable },
      })
      return
    }

    console.error('[ocr] unexpected', error)
    sendJson(res, 500, {
      error: {
        code: 'internal_error',
        message: 'Something went wrong reading the receipt.',
        retryable: true,
      },
    })
  }
}
