import type { Person, Receipt, ReceiptItem } from '../types/receipt.ts'
import { createId } from '../lib/id.ts'

/**
 * Stand-in for the OCR step, which is not built yet. The whole flow runs on this so
 * the screens can be exercised end to end.
 */
export function createMockReceipt(): Receipt {
  return {
    restaurantName: 'The Green Table',
    date: '2026-09-09',
    subtotal: 680,
    vat: 61.2,
    taxes: 13.6,
    serviceCharge: 40,
    otherCharges: 5.2,
    total: 800,
    items: [
      { id: 'item-salad', name: 'Caesar Salad', price: 120 },
      { id: 'item-chicken', name: 'Grilled Chicken', price: 220 },
      { id: 'item-pizza', name: 'Margherita Pizza', price: 180 },
      { id: 'item-lemonade', name: 'Lemonade', price: 40 },
      { id: 'item-cake', name: 'Chocolate Cake', price: 120 },
    ],
  }
}

export function createEmptyReceipt(): Receipt {
  return {
    restaurantName: '',
    date: new Date().toISOString().slice(0, 10),
    subtotal: 0,
    vat: 0,
    taxes: 0,
    serviceCharge: 0,
    otherCharges: 0,
    total: 0,
    items: [createItem()],
  }
}

export function createMockPeople(): Person[] {
  return [
    { id: 'person-maria', name: 'Maria' },
    { id: 'person-sara', name: 'Sara' },
    { id: 'person-nour', name: 'Nour' },
  ]
}

export function createItem(): ReceiptItem {
  return { id: createId('item'), name: '', price: 0 }
}

export function createPerson(name = ''): Person {
  return { id: createId('person'), name }
}
