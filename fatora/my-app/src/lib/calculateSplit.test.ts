import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMockPeople, createMockReceipt } from '../data/mockReceipt.ts'
import { createInitialState, splitSessionReducer } from '../state/splitSessionReducer.ts'
import { calculateSplit, chargesCents } from './calculateSplit.ts'
import { allocateCents, parseAmount, toCents } from './money.ts'
import { validateAssignments, validatePeople, validateReceipt } from './validation.ts'

const receipt = createMockReceipt()
const people = createMockPeople()
const [maria, sara, nour] = people.map((person) => person.id) as [string, string, string]

/** Every item assigned to somebody, with a mix of solo and shared lines. */
const fullyAssigned = {
  'item-salad': [maria, sara],
  'item-chicken': [sara],
  'item-pizza': [maria, sara, nour],
  'item-lemonade': [nour],
  'item-cake': [maria, nour],
}

test('shares add back up to the total printed on the receipt', () => {
  const split = calculateSplit(receipt, people, fullyAssigned)

  assert.equal(toCents(split.unassignedSubtotal), 0)
  assert.equal(
    split.shares.reduce((sum, share) => sum + toCents(share.total), 0),
    toCents(receipt.total),
  )
})

test('an odd amount split three ways loses no cents', () => {
  const tenPounds = {
    ...receipt,
    items: [{ id: 'x', name: 'Tea', price: 10 }],
    vat: 0,
    taxes: 0,
    serviceCharge: 0,
    otherCharges: 0,
  }

  const split = calculateSplit(tenPounds, people, { x: [maria, sara, nour] })

  assert.deepEqual(
    split.shares.map((share) => toCents(share.itemSubtotal)).sort(),
    [333, 333, 334],
  )
})

test('unassigned items are reported rather than silently dropped', () => {
  const split = calculateSplit(receipt, people, { ...fullyAssigned, 'item-cake': [] })

  assert.equal(toCents(split.unassignedSubtotal), toCents(120))
})

test('charges fall back to an even split when no items are assigned', () => {
  const split = calculateSplit(receipt, people, {})

  assert.ok(split.shares.every((share) => Number.isFinite(share.total)))
  assert.equal(
    split.shares.reduce((sum, share) => sum + toCents(share.total), 0),
    chargesCents(receipt),
  )
})

test('every charge line on the receipt is allocated, taxes included', () => {
  const split = calculateSplit(receipt, people, fullyAssigned)

  // Guards against a new charge field being added to the receipt but not the split.
  const allocated = split.shares.reduce(
    (sum, share) =>
      sum +
      toCents(share.vat) +
      toCents(share.taxes) +
      toCents(share.serviceCharge) +
      toCents(share.otherCharges),
    0,
  )

  assert.equal(allocated, chargesCents(receipt))
  assert.ok(toCents(receipt.taxes) > 0, 'the mock receipt should exercise the taxes line')
  assert.equal(
    split.shares.reduce((sum, share) => sum + toCents(share.taxes), 0),
    toCents(receipt.taxes),
  )
})

test('unknown and duplicated assignee ids do not distort a share', () => {
  const split = calculateSplit(receipt, people, { 'item-salad': ['ghost', maria, maria] })

  assert.equal(toCents(split.shares[0]!.itemSubtotal), toCents(120))
})

test('allocateCents preserves the total for any weights', () => {
  for (const total of [0, 1, 7, 999, 100_000]) {
    for (const weights of [[1], [0, 0], [1, 2, 3], [5, 0, 0, 1]]) {
      const parts = allocateCents(total, weights)
      assert.equal(
        parts.reduce((sum, part) => sum + part, 0),
        total,
        `allocating ${total} across ${weights.join('/')}`,
      )
    }
  }
})

test('parseAmount never produces NaN', () => {
  for (const raw of ['12.50', 'abc', '', '1.2.3', '-5', '12,50 EGP']) {
    assert.ok(Number.isFinite(parseAmount(raw)), `parseAmount(${JSON.stringify(raw)})`)
  }
})

test('removing a person clears them from every item they shared', () => {
  let state = splitSessionReducer(createInitialState(), { type: 'start', receipt, people })
  state = splitSessionReducer(state, {
    type: 'toggleAssignee',
    itemId: 'item-salad',
    personId: maria,
  })
  state = splitSessionReducer(state, {
    type: 'toggleAssignee',
    itemId: 'item-salad',
    personId: sara,
  })
  state = splitSessionReducer(state, { type: 'removePerson', id: maria })

  assert.deepEqual(state.assignments['item-salad'], [sara])
  assert.equal(state.people.length, 2)
})

test('removing an item drops its assignment entry', () => {
  let state = splitSessionReducer(createInitialState(), { type: 'start', receipt, people })
  state = splitSessionReducer(state, { type: 'removeItem', id: 'item-salad' })

  assert.equal('item-salad' in state.assignments, false)
})

test('the split ignores the subtotal and total the reader reported', () => {
  // Requirement: never trust OCR for calculations. Item prices and charge lines are
  // transcribed figures and do feed the maths; subtotal and total are the receipt's
  // own arithmetic, so they must not. Corrupting them must change nothing.
  const trusted = calculateSplit(receipt, people, fullyAssigned)
  const corrupted = calculateSplit(
    { ...receipt, subtotal: 999_999, total: -1 },
    people,
    fullyAssigned,
  )

  assert.deepEqual(corrupted.shares, trusted.shares)
  assert.equal(corrupted.splitTotal, trusted.splitTotal)
  assert.equal(corrupted.itemsSubtotal, trusted.itemsSubtotal)
  assert.equal(corrupted.allocatedTotal, trusted.allocatedTotal)
})

test('each step blocks until its own requirements are met', () => {
  assert.equal(validateReceipt(receipt).isValid, true)
  assert.equal(validatePeople([]).isValid, false)
  assert.equal(validatePeople([{ id: 'p', name: '  ' }]).isValid, false)
  assert.equal(validateAssignments(receipt, {}).isValid, false)
  assert.equal(validateAssignments(receipt, fullyAssigned).isValid, true)
})
