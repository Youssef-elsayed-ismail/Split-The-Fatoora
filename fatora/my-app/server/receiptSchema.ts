import { z } from 'zod'

/**
 * What Claude is asked to return. Deliberately close to the app's `Receipt` type,
 * minus the item ids — those are generated here, not by the model.
 *
 * Every field is required. Asking for 0 rather than allowing omissions keeps the
 * schema flat and means the UI never has to deal with `undefined`.
 */
export const ExtractedReceiptSchema = z.object({
  restaurantName: z
    .string()
    .describe('Name of the restaurant or shop. Empty string if not printed.'),
  date: z
    .string()
    .describe('Date on the receipt as yyyy-mm-dd. Empty string if not printed or unreadable.'),
  items: z
    .array(
      z.object({
        name: z.string().describe('The item name as printed, without the quantity prefix.'),
        price: z
          .number()
          .describe(
            'The amount printed on that line — unit price multiplied by quantity, not the unit price.',
          ),
      }),
    )
    .describe('One entry per item line. Do not include subtotal, tax or total lines here.'),
  subtotal: z.number().describe('Subtotal as printed before any charges. 0 if not printed.'),
  vat: z.number().describe('VAT as printed. 0 if not printed.'),
  taxes: z
    .number()
    .describe('Any other tax printed separately from VAT, e.g. municipality tax. 0 if none.'),
  serviceCharge: z.number().describe('Service charge or gratuity as printed. 0 if none.'),
  otherCharges: z
    .number()
    .describe('Anything else added or deducted, e.g. delivery or a discount. Negative if a discount.'),
  total: z.number().describe('Grand total as printed. 0 if not printed.'),
})

export type ExtractedReceipt = z.infer<typeof ExtractedReceiptSchema>

export const SYSTEM_PROMPT = `You read photographs of restaurant and shop receipts and return the printed figures as structured data.

Rules:
- Transcribe only what is printed. Never invent, estimate or "fix" a figure. If something is unreadable, use 0 for a number or an empty string for text.
- Every amount is a plain number with no currency symbol or thousands separator.
- An item line's price is the amount printed at the end of that line. When a line reads "2 x Latte  90.00", the name is "Latte" and the price is 90.00 — do not divide it back to the unit price.
- Put item lines in "items" only. Subtotal, VAT, taxes, service, discounts and the total belong in their own fields, never as items.
- A discount or credit goes in otherCharges as a negative number.
- If a charge is printed as a percentage with an amount next to it, record the amount.
- Do not make the numbers add up. If the receipt's own arithmetic is inconsistent, report it exactly as printed — the app shows the user where it disagrees.
- If the image is not a receipt, return empty items, empty strings and zeros.`
