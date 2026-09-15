import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateRawReceipt } from './validate.ts'

const ids = (index: number) => `item-${index}`
const FIXED_TODAY = new Date('2026-09-10T12:00:00Z')

const good = {
  restaurantName: 'Cafe Masry',
  date: '2026-03-14',
  items: [
    { name: 'Falafel Wrap', price: 76 },
    { name: 'Koshary', price: 55.5 },
  ],
  subtotal: 131.5,
  vat: 18.41,
  taxes: 2.63,
  serviceCharge: 15.78,
  otherCharges: 0,
  total: 168.32,
}

test('a clean read passes through untouched and is marked complete', () => {
  const { receipt, warnings, complete } = validateRawReceipt(good, ids, FIXED_TODAY)

  assert.equal(complete, true)
  assert.deepEqual(warnings, [])
  assert.equal(receipt.restaurantName, 'Cafe Masry')
  assert.equal(receipt.date, '2026-03-14')
  assert.equal(receipt.items.length, 2)
  assert.equal(receipt.total, 168.32)
})

test('junk from a provider cannot reach the app', () => {
  const { receipt } = validateRawReceipt(
    {
      restaurantName: 42,
      date: { nope: true },
      items: 'not an array',
      subtotal: null,
      vat: Number.NaN,
      taxes: Infinity,
      serviceCharge: undefined,
      otherCharges: 'abc',
      total: [],
    },
    ids,
    FIXED_TODAY,
  )

  assert.equal(receipt.restaurantName, '')
  assert.deepEqual(receipt.items, [])
  for (const key of ['subtotal', 'vat', 'taxes', 'serviceCharge', 'otherCharges', 'total'] as const) {
    assert.equal(receipt[key], 0, key)
    assert.ok(Number.isFinite(receipt[key]), `${key} finite`)
  }
})

test('numbers arriving as strings are recovered, not discarded', () => {
  const { receipt } = validateRawReceipt(
    { ...good, subtotal: '1,234.50', vat: 'EGP 12.30' },
    ids,
    FIXED_TODAY,
  )

  assert.equal(receipt.subtotal, 1234.5)
  assert.equal(receipt.vat, 12.3)
})

test('amounts are rounded to whole cents and absurd values dropped', () => {
  const { receipt } = validateRawReceipt(
    { ...good, subtotal: 10.005, vat: 3.14159, total: 9_999_999_999 },
    ids,
    FIXED_TODAY,
  )

  assert.equal(receipt.subtotal, 10.01)
  assert.equal(receipt.vat, 3.14)
  assert.equal(receipt.total, 0, 'implausible amount is dropped rather than shown')
})

test('a discount survives as a negative other charge', () => {
  const { receipt } = validateRawReceipt({ ...good, otherCharges: -20 }, ids, FIXED_TODAY)
  assert.equal(receipt.otherCharges, -20)
})

test('an unreadable date falls back to today and says so', () => {
  for (const date of ['', 'yesterday', '2026-02-30', '14/03/2026']) {
    const { receipt, warnings } = validateRawReceipt({ ...good, date }, ids, FIXED_TODAY)
    assert.equal(receipt.date, '2026-09-10', `fallback for ${JSON.stringify(date)}`)
    assert.ok(
      warnings.some((w) => w.includes('date')),
      `warning for ${JSON.stringify(date)}`,
    )
  }
})

test('an empty read is incomplete but still returns an editable receipt', () => {
  const { receipt, warnings, complete } = validateRawReceipt({}, ids, FIXED_TODAY)

  assert.equal(complete, false)
  assert.deepEqual(receipt.items, [])
  assert.ok(warnings.some((w) => w.includes('item lines')), 'flags the missing items')
  // Requirement: the user must be able to correct everything, so the shape is intact.
  assert.equal(typeof receipt.restaurantName, 'string')
  assert.equal(receipt.date, '2026-09-10')
})

test('partly-read items are kept and flagged rather than thrown away', () => {
  const { receipt, warnings, complete } = validateRawReceipt(
    {
      ...good,
      items: [
        { name: 'Koshary', price: 55.5 },
        { name: '', price: 30 },
        { name: 'Tea', price: 0 },
        { name: '', price: 0 },
      ],
    },
    ids,
    FIXED_TODAY,
  )

  assert.equal(complete, false)
  assert.equal(receipt.items.length, 3, 'the wholly-blank line is dropped, the rest kept')
  assert.ok(warnings.some((w) => w.includes('names')), 'flags blank names')
  assert.ok(warnings.some((w) => w.includes('prices')), 'flags unreadable prices')
})

test('nothing is computed to fill a gap', () => {
  // Items are present but no subtotal or total was printed/read. A helpful-looking
  // guess here would be indistinguishable from a figure actually read off the paper.
  const { receipt } = validateRawReceipt(
    { items: good.items, restaurantName: 'X', date: '2026-03-14' },
    ids,
    FIXED_TODAY,
  )

  assert.equal(receipt.subtotal, 0, 'subtotal not derived from items')
  assert.equal(receipt.total, 0, 'total not derived from items and charges')
})

test('item ids come from the app, not the provider', () => {
  const { receipt } = validateRawReceipt(
    { ...good, items: [{ name: 'A', price: 1, id: 'evil' }, { name: 'B', price: 2 }] },
    (index) => `minted-${index}`,
    FIXED_TODAY,
  )

  assert.deepEqual(
    receipt.items.map((item) => item.id),
    ['minted-0', 'minted-1'],
  )
})
