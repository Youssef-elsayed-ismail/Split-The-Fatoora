export const CURRENCY = 'EGP'

/** All money math runs in integer cents so shares always sum back to the total. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** Keeps only digits and a single decimal point, so a stray character cannot produce NaN. */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [whole = '', ...rest] = cleaned.split('.')
  const normalized = rest.length > 0 ? `${whole}.${rest.join('')}` : whole
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(amount: number): string {
  return formatter.format(Number.isFinite(amount) ? amount : 0)
}

export function formatCurrency(amount: number): string {
  return `${formatMoney(amount)} ${CURRENCY}`
}

/**
 * Splits `totalCents` across `weights` using the largest-remainder method, so the
 * parts are as proportional as whole cents allow and always add back up to the
 * total. Zero (or absent) weights fall back to an even split.
 */

export function allocateCents(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return []

  const weightSum = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0)
  const effectiveWeights =
    weightSum > 0 ? weights.map((weight) => Math.max(weight, 0)) : weights.map(() => 1)
  const effectiveSum = weightSum > 0 ? weightSum : effectiveWeights.length

  const exact = effectiveWeights.map((weight) => (totalCents * weight) / effectiveSum)
  const floored = exact.map((value) => Math.floor(value))
  const distributed = floored.reduce((sum, value) => sum + value, 0)

  // Hand out the leftover cents to the largest fractional remainders first.
  const remainder = totalCents - distributed
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)

  const result = [...floored]
  const step = remainder >= 0 ? 1 : -1
  for (let given = 0; given < Math.abs(remainder); given += 1) {
    const target = order[given % order.length]
    if (target) result[target.index] = (result[target.index] ?? 0) + step
  }

  return result
}
