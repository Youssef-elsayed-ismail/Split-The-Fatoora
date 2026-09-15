/** A single line on the receipt. */
export interface ReceiptItem {
  id: string
  name: string
  /** Unit price multiplied by quantity, i.e. the amount printed on the line. */
  price: number
}

/** Charges applied on top of the item lines. */
export interface ReceiptCharges {
  vat: number
  /** Any tax printed separately from VAT, e.g. a municipality or tourism tax. */
  taxes: number
  serviceCharge: number
  otherCharges: number
}

/** The charge fields, in the order they are shown to the user. */
export const CHARGE_FIELDS = [
  { key: 'vat', label: 'VAT' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'serviceCharge', label: 'Service charge' },
  { key: 'otherCharges', label: 'Other charges' },
] as const satisfies readonly { key: keyof ReceiptCharges; label: string }[]

export interface Receipt extends ReceiptCharges {
  restaurantName: string
  /** ISO date string (yyyy-mm-dd) as printed on the receipt. */
  date: string
  /** Subtotal as printed, used to sanity-check the extracted item lines. */
  subtotal: number
  /** Grand total as printed, used to sanity-check the computed split. */
  total: number
  items: ReceiptItem[]
}

export interface Person {
  id: string
  name: string
}

/** Maps an item id to the ids of the people sharing that item. */
export type Assignments = Record<string, string[]>
