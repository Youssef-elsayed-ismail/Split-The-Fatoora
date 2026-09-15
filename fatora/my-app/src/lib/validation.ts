import type { Assignments, Person, Receipt } from '../types/receipt.ts'
import { chargesCents } from './calculateSplit.ts'
import { formatMoney, toCents } from './money.ts'

/** Tolerance for comparing a computed figure against the one printed on the receipt. */
const TOLERANCE_CENTS = 50

export interface StepValidation {
  /** Blocking problems: the user cannot move on until these are cleared. */
  errors: string[]
  /** Things worth a second look that should not block the flow. */
  warnings: string[]
  isValid: boolean
}

function result(errors: string[], warnings: string[] = []): StepValidation {
  return { errors, warnings, isValid: errors.length === 0 }
}

export function validateReceipt(receipt: Receipt): StepValidation {
  const errors: string[] = []
  const warnings: string[] = []

  const named = receipt.items.filter((item) => item.name.trim().length > 0)
  if (named.length === 0) {
    errors.push('Add at least one item to split.')
  }
  if (receipt.items.some((item) => item.name.trim().length === 0)) {
    errors.push('Every item needs a name.')
  }
  if (receipt.items.some((item) => toCents(item.price) <= 0)) {
    errors.push('Every item needs a price greater than zero.')
  }

  const itemsCents = receipt.items.reduce((sum, item) => sum + toCents(item.price), 0)
  const subtotalCents = toCents(receipt.subtotal)
  const charges = chargesCents(receipt)
  const totalCents = toCents(receipt.total)

  // Both of these are warnings, not errors: the numbers may legitimately not tie up,
  // and the user can correct either side on this screen.
  if (subtotalCents > 0 && Math.abs(itemsCents - subtotalCents) > TOLERANCE_CENTS) {
    warnings.push(
      `Your items add up to ${formatMoney(itemsCents / 100)}, but the receipt subtotal says ${formatMoney(receipt.subtotal)}. Fix an item price, or set the subtotal to match.`,
    )
  }

  if (totalCents > 0 && Math.abs(itemsCents + charges - totalCents) > TOLERANCE_CENTS) {
    warnings.push(
      `Items plus charges comes to ${formatMoney((itemsCents + charges) / 100)}, but the receipt total says ${formatMoney(receipt.total)}.`,
    )
  }

  return result(errors, warnings)
}

export function validatePeople(people: Person[]): StepValidation {
  const errors: string[] = []

  if (people.length === 0) {
    errors.push('Add at least one person.')
  }
  if (people.some((person) => person.name.trim().length === 0)) {
    errors.push('Every person needs a name.')
  }

  const names = people.map((person) => person.name.trim().toLowerCase())
  if (new Set(names).size !== names.length) {
    errors.push('Two people have the same name — make them unique so the results stay readable.')
  }

  return result(errors)
}

/** Item ids that nobody is assigned to yet. */
export function findUnassignedItemIds(receipt: Receipt, assignments: Assignments): string[] {
  return receipt.items
    .filter((item) => (assignments[item.id] ?? []).length === 0)
    .map((item) => item.id)
}

export function validateAssignments(receipt: Receipt, assignments: Assignments): StepValidation {
  const unassigned = findUnassignedItemIds(receipt, assignments)
  const errors: string[] = []

  if (unassigned.length > 0) {
    errors.push(
      unassigned.length === 1
        ? '1 item still needs someone assigned to it.'
        : `${unassigned.length} items still need someone assigned to them.`,
    )
  }

  return result(errors)
}
