/**
 * The OCR seam. Everything above this file talks in these types, so swapping
 * provider means adding one module and one line in `./index.ts` — no changes to
 * the endpoint, the validator, or the app.
 */

/** Image types the endpoint accepts. Providers may support fewer; they should say so. */
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

export interface OcrImage {
  /** Base64 with no data-URL prefix. */
  base64: string
  mediaType: SupportedMediaType
}

/**
 * What a provider hands back: the shape we asked for, but every field typed
 * `unknown` on purpose. OCR output is never trusted — `validateRawReceipt` is the
 * only thing allowed to turn this into a `Receipt`.
 */
export interface RawReceipt {
  restaurantName?: unknown
  date?: unknown
  items?: unknown
  subtotal?: unknown
  vat?: unknown
  taxes?: unknown
  serviceCharge?: unknown
  otherCharges?: unknown
  total?: unknown
}

export interface OcrProvider {
  /** Shown in logs and returned to the client for debugging. */
  readonly name: string
  /** Reads a receipt image. Throws `OcrError` for anything the caller should report. */
  read(image: OcrImage): Promise<RawReceipt>
}

/** A failure worth showing the user, with a message already worded for them. */
export class OcrError extends Error {
  code: string
  status: number
  /** False when retrying the same image cannot help (bad key, unsupported input). */
  retryable: boolean

  constructor(code: string, message: string, status = 502, retryable = true) {
    super(message)
    this.name = 'OcrError'
    this.code = code
    this.status = status
    this.retryable = retryable
  }
}
