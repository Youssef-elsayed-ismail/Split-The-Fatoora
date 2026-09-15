import { CHARGE_FIELDS, type Assignments, type Person, type Receipt } from '../types/receipt.ts'
import type { PersonShare, SplitResult } from '../types/split.ts'
import { allocateCents, fromCents, toCents } from './money.ts'

/** Total of every charge line on the receipt, in cents. */
export function chargesCents(receipt: Receipt): number {
  return CHARGE_FIELDS.reduce((sum, { key }) => sum + toCents(receipt[key]), 0)
}

/**
 * Works out what each person owes.
 *
 * Every item is divided evenly between the people assigned to it. VAT, service and
 * other charges are then spread across people in proportion to the items they took,
 * so someone who ordered more also carries more of the charges.
 *
 * Pure: no UI, no state, no side effects.
 */
export function calculateSplit(
  receipt: Receipt,
  people: Person[],
  assignments: Assignments,
): SplitResult {
  const indexByPerson = new Map(people.map((person, index) => [person.id, index]))
  const itemCentsByPerson = people.map(() => 0)

  let itemsCents = 0
  let unassignedCents = 0

  for (const item of receipt.items) {
    const itemCents = toCents(item.price)
    itemsCents += itemCents

    // Ignore ids that no longer point at a person, and count duplicates once.
    const assignees = [...new Set(assignments[item.id] ?? [])].filter((id) =>
      indexByPerson.has(id),
    )

    if (assignees.length === 0) {
      unassignedCents += itemCents
      continue
    }

    const perAssignee = allocateCents(
      itemCents,
      assignees.map(() => 1),
    )

    assignees.forEach((personId, position) => {
      const index = indexByPerson.get(personId)
      if (index === undefined) return
      itemCentsByPerson[index] = (itemCentsByPerson[index] ?? 0) + (perAssignee[position] ?? 0)
    })
  }

  const assignedCents = itemCentsByPerson.reduce((sum, cents) => sum + cents, 0)

  // Each charge is spread over the same item weights, so every charge line is
  // handled identically and adding one later needs no change here.
  const chargeShares = CHARGE_FIELDS.map(({ key }) => ({
    key,
    perPerson: allocateCents(toCents(receipt[key]), itemCentsByPerson),
  }))

  const shares: PersonShare[] = people.map((person, index) => {
    const itemShare = itemCentsByPerson[index] ?? 0
    const charges = { vat: 0, taxes: 0, serviceCharge: 0, otherCharges: 0 }
    let chargeTotal = 0

    for (const { key, perPerson } of chargeShares) {
      const cents = perPerson[index] ?? 0
      charges[key] = fromCents(cents)
      chargeTotal += cents
    }

    return {
      personId: person.id,
      name: person.name,
      itemSubtotal: fromCents(itemShare),
      ...charges,
      total: fromCents(itemShare + chargeTotal),
    }
  })

  const allocatedCents = assignedCents + chargesCents(receipt)

  return {
    shares,
    itemsSubtotal: fromCents(itemsCents),
    assignedSubtotal: fromCents(assignedCents),
    unassignedSubtotal: fromCents(unassignedCents),
    allocatedTotal: fromCents(allocatedCents),
    splitTotal: fromCents(shares.reduce((sum, share) => sum + toCents(share.total), 0)),
  }
}
