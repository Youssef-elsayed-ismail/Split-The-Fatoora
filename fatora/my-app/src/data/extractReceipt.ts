import type { Receipt } from '../types/receipt.ts'

/** Extraction is real now; the UI no longer labels the result as sample data. */
export const EXTRACTION_IS_MOCKED = false

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const EXTRACT_URL = API_BASE_URL ? `${API_BASE_URL}/api/extract` : '/api/extract'

/** A receipt read off a photo, plus whatever the server could not read confidently. */
export interface ExtractionResult {
  receipt: Receipt
  /** Things for the user to check on Receipt Review. Empty on a clean read. */
  warnings: string[]
  /** False when the read is too thin to rely on without editing. */
  complete: boolean
}

/** Thrown with a message already worded for the user. */
export class ExtractionFailed extends Error {
  retryable: boolean

  constructor(message: string, retryable = true) {
    super(message)
    this.name = 'ExtractionFailed'
    this.retryable = retryable
  }
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new ExtractionFailed('That image could not be read.', false))
    reader.onload = () => {
      // Strip the `data:<type>;base64,` prefix the API does not want.
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      if (comma === -1) {
        reject(new ExtractionFailed('That image could not be read.', false))
        return
      }
      resolve(result.slice(comma + 1))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Last line of defence on the shape of the receipt. The server validates too; this
 * repeats the coercion so a field it somehow omitted cannot reach the UI as
 * `undefined`. Nothing is computed here — bill maths belongs to `calculateSplit`.
 */
function coerce(value: unknown): Receipt {
  const raw = (value ?? {}) as Partial<Receipt>
  const num = (input: unknown) => (typeof input === 'number' && Number.isFinite(input) ? input : 0)

  return {
    restaurantName: typeof raw.restaurantName === 'string' ? raw.restaurantName : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date))
      ? String(raw.date)
      : new Date().toISOString().slice(0, 10),
    items: (Array.isArray(raw.items) ? raw.items : []).map((item, index) => ({
      id: typeof item?.id === 'string' && item.id ? item.id : `item-${index}`,
      name: typeof item?.name === 'string' ? item.name : '',
      price: num(item?.price),
    })),
    subtotal: num(raw.subtotal),
    vat: num(raw.vat),
    taxes: num(raw.taxes),
    serviceCharge: num(raw.serviceCharge),
    otherCharges: num(raw.otherCharges),
    total: num(raw.total),
  }
}

/**
 * Sends the receipt photo to `/api/extract`, which reads it and returns the printed
 * figures. The API key lives on the server; the browser never sees it.
 *
 * A thin or partial read is **not** an error — it resolves with warnings so the user
 * lands on Receipt Review and corrects it. Only a failure to read at all rejects.
 */
export async function extractReceipt(file: File): Promise<ExtractionResult> {
  const imageBase64 = await readAsBase64(file)

  let response: Response
  try {
    response = await fetch(EXTRACT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageBase64, mediaType: file.type }),
    })
  } catch {
    throw new ExtractionFailed('Could not reach the server. Check your connection and try again.')
  }

  const payload = (await response.json().catch(() => null)) as {
    receipt?: unknown
    extraction?: { complete?: unknown; warnings?: unknown }
    error?: { message?: string; retryable?: unknown }
  } | null

  if (!response.ok) {
    throw new ExtractionFailed(
      payload?.error?.message ?? 'The receipt could not be read. Try another photo.',
      payload?.error?.retryable !== false,
    )
  }

  const warnings = Array.isArray(payload?.extraction?.warnings)
    ? payload.extraction.warnings.filter((entry): entry is string => typeof entry === 'string')
    : []

  return {
    receipt: coerce(payload?.receipt),
    warnings,
    complete: payload?.extraction?.complete === true,
  }
}
