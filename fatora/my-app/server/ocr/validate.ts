import type { Receipt, ReceiptItem } from '../../src/types/receipt.ts'
import type { RawReceipt } from './provider.ts'

/**
 * Turns whatever a provider returned into a `Receipt` the app can render.
 *
 * Two rules drive everything here:
 *
 * 1. **Nothing is trusted.** Every field is re-checked and coerced. A provider that
 *    returns nulls, strings where numbers belong, or extra keys cannot produce a
 *    receipt the UI has to defend against.
 * 2. **Nothing is computed.** Missing figures stay 0 rather than being derived from
 *    the other lines. The deterministic calculation module owns all bill maths, and
 *    inventing a subtotal here would launder a guess into something that looks read.
 *
 * Gaps and oddities come back as `warnings` for the user to resolve on Receipt
 * Review. They are never errors — a partial read is still a useful starting point.
 */
export interface ValidatedReceipt {
  receipt: Receipt
  /** Things the user should check, worded for them. */
  warnings: string[]
  /** False when the read is too thin to rely on without editing. */
  complete: boolean
}

/** Reject prices that are obviously not money read off a receipt. */
const MAX_AMOUNT = 1_000_000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toAmount(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(/[^\d.-]/g, '')) : value
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return 0
  if (Math.abs(parsed) > MAX_AMOUNT) return 0
  // Money is two decimal places; anything finer is an OCR artefact.
  return Math.round(parsed * 100) / 100
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function toItems(value: unknown, makeId: (index: number) => string): ReceiptItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      const raw = (entry ?? {}) as { name?: unknown; price?: unknown }
      return {
        id: makeId(index),
        name: toText(raw.name),
        price: toAmount(raw.price),
      }
    })
    // A line with neither a name nor a price carries no information at all.
    .filter((item) => item.name !== '' || item.price !== 0)
}

export function validateRawReceipt(
  raw: RawReceipt,
  makeId: (index: number) => string,
  today = new Date(),
): ValidatedReceipt {
  const warnings: string[] = []

  const items = toItems(raw.items, makeId)
  const rawDate = toText(raw.date)
  const restaurantName = toText(raw.restaurantName)

  const receipt: Receipt = {
    restaurantName,
    // An unreadable date defaults to today rather than being left blank, so the
    // date input has something valid in it; the warning tells the user to check.
    date: isRealDate(rawDate) ? rawDate : today.toISOString().slice(0, 10),
    items,
    subtotal: toAmount(raw.subtotal),
    vat: toAmount(raw.vat),
    taxes: toAmount(raw.taxes),
    serviceCharge: toAmount(raw.serviceCharge),
    otherCharges: toAmount(raw.otherCharges),
    total: toAmount(raw.total),
  }

  if (items.length === 0) {
    warnings.push('No item lines could be read. Add them below.')
  }
  if (items.some((item) => item.name === '')) {
    warnings.push('Some item names came back blank. Fill them in below.')
  }
  if (items.some((item) => item.price === 0)) {
    warnings.push('Some item prices could not be read. Check the ones showing 0.00.')
  }
  if (restaurantName === '') {
    warnings.push('The restaurant name could not be read.')
  }
  if (!isRealDate(rawDate)) {
    warnings.push('The date could not be read, so today’s date is filled in.')
  }
  if (receipt.total === 0) {
    warnings.push('The receipt total could not be read.')
  }

  // The read is only trustworthy if there are items and every one of them is usable.
  const complete =
    items.length > 0 && items.every((item) => item.name !== '' && item.price !== 0)

  return { receipt, warnings, complete }
}
