// Renders a plain receipt as a PNG so the extraction endpoint can be tested
// end to end without a real photo. Throwaway helper, not part of the app.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const W = 380
const H = 520
const SCALE = 2

// 5x7 bitmap font, enough for the characters a receipt needs.
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10011', '01111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '01100', '11000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['10001', '00010', '00010', '00100', '01000', '01000', '10001'],
  x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const px = new Uint8Array(W * H).fill(255)

function dot(x, y) {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return
  px[yi * W + xi] = 0
}

function drawText(text, x, y, scale = 1) {
  let cx = x
  for (const raw of text) {
    const glyph = GLYPHS[raw] ?? GLYPHS[raw.toUpperCase()] ?? GLYPHS[' ']
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] !== '1') continue
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) dot(cx + col * scale + dx, y + row * scale + dy)
        }
      }
    }
    cx += 6 * scale
  }
}

function drawRight(text, right, y, scale = 1) {
  drawText(text, right - text.length * 6 * scale, y, scale)
}

function rule(y) {
  for (let x = 24; x < W - 24; x += 3) dot(x, y)
}

// --- The receipt content. These are the values the test asserts against. ---
const ITEMS = [
  ['2 x FALAFEL WRAP', '76.00'],
  ['KOSHARY LARGE', '55.50'],
  ['GRILLED HALLOUMI', '92.00'],
  ['MINT LEMONADE', '38.25'],
  ['BAKLAVA PLATE', '64.00'],
]

let y = 28
drawText('CAFE MASRY', 118, y, 2)
y += 26
drawText('26 TALAAT HARB, CAIRO', 96, y)
y += 14
drawText('TEL: 02 2575 1188', 112, y)
y += 22
drawText('DATE: 2026-03-14   14:32', 84, y)
y += 18
rule(y)
y += 16

for (const [name, price] of ITEMS) {
  drawText(name, 28, y)
  drawRight(price, W - 28, y)
  y += 18
}

y += 6
rule(y)
y += 16

const LINES = [
  ['SUBTOTAL', '325.75'],
  ['VAT 14%', '45.61'],
  ['MUNICIPALITY TAX 2%', '6.52'],
  ['SERVICE CHARGE 12%', '39.09'],
  ['DELIVERY', '25.00'],
]

for (const [label, value] of LINES) {
  drawText(label, 28, y)
  drawRight(value, W - 28, y)
  y += 18
}

y += 6
rule(y)
y += 16
drawText('TOTAL', 28, y, 2)
drawRight('441.97', W - 28, y, 2)
y += 34
drawText('THANK YOU', 140, y)

// --- Encode as an 8-bit greyscale PNG, upscaled for legibility ---
const rows = []
for (let sy = 0; sy < H * SCALE; sy++) {
  const row = Buffer.alloc(W * SCALE + 1)
  row[0] = 0
  for (let sx = 0; sx < W * SCALE; sx++) {
    row[sx + 1] = px[Math.floor(sy / SCALE) * W + Math.floor(sx / SCALE)]
  }
  rows.push(row)
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crcTable = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of body) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
  return Buffer.concat([len, body, crcBuf])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W * SCALE, 0)
ihdr.writeUInt32BE(H * SCALE, 4)
ihdr[8] = 8
ihdr[9] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync(process.argv[2] ?? 'test-receipt.png', png)
console.log(`wrote ${process.argv[2] ?? 'test-receipt.png'} (${png.length} bytes)`)
