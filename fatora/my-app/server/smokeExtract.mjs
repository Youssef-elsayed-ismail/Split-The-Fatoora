// Posts the synthetic receipt at a running /api/extract and checks the result
// against what the image actually says. Throwaway helper, not part of the app.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const base = process.env.BASE ?? 'http://localhost:5210'
const imageBase64 = readFileSync('test-receipt.png').toString('base64')

console.log(`POST ${base}/api/extract  (${Math.round(imageBase64.length / 1024)} KB base64)`)
const started = Date.now()

const response = await fetch(`${base}/api/extract`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ imageBase64, mediaType: 'image/png' }),
})

const payload = await response.json()
console.log(`-> ${response.status} in ${((Date.now() - started) / 1000).toFixed(1)}s`)

if (!response.ok) {
  console.error(JSON.stringify(payload, null, 2))
  process.exit(1)
}

const { receipt, extraction } = payload
console.log(JSON.stringify(payload, null, 2))

const cents = (n) => Math.round(n * 100)

// The endpoint reports which provider ran and how confident the read was.
assert.ok(extraction, 'extraction block present')
assert.equal(typeof extraction.provider, 'string', 'provider named')
assert.equal(extraction.complete, true, 'a legible receipt should read as complete')
assert.deepEqual(extraction.warnings, [], 'no warnings on a legible receipt')

// What the image prints.
assert.match(receipt.restaurantName.toUpperCase(), /CAFE MASRY/, 'restaurant name')
assert.equal(receipt.date, '2026-03-14', 'date')
assert.equal(receipt.items.length, 5, 'item count')
assert.equal(cents(receipt.subtotal), 32575, 'subtotal')
assert.equal(cents(receipt.vat), 4561, 'vat')
assert.equal(cents(receipt.taxes), 652, 'municipality tax -> taxes')
assert.equal(cents(receipt.serviceCharge), 3909, 'service charge')
assert.equal(cents(receipt.otherCharges), 2500, 'delivery -> otherCharges')
assert.equal(cents(receipt.total), 44197, 'total')

// The "2 x FALAFEL WRAP  76.00" line must keep the printed line total.
const wrap = receipt.items.find((item) => /falafel/i.test(item.name))
assert.ok(wrap, 'falafel wrap line present')
assert.equal(cents(wrap.price), 7600, 'line total kept, not divided to unit price')

// Items must sum to the printed subtotal.
const itemsSum = receipt.items.reduce((sum, item) => sum + cents(item.price), 0)
assert.equal(itemsSum, 32575, 'items sum to subtotal')

// Every item needs a unique id for React keys and assignment lookups.
const ids = new Set(receipt.items.map((item) => item.id))
assert.equal(ids.size, receipt.items.length, 'item ids unique')
assert.ok([...ids].every((id) => typeof id === 'string' && id.length > 0), 'item ids present')

console.log('\nAll extraction assertions passed.')
