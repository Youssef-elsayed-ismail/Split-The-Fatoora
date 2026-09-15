import { chargesCents } from '../../lib/calculateSplit.ts'
import { formatCurrency, fromCents, toCents } from '../../lib/money.ts'
import { CHARGE_FIELDS, type Receipt } from '../../types/receipt.ts'
import { Card } from '../ui/Card.tsx'
import styles from './receipt.module.css'

interface ReceiptTotalsProps {
  receipt: Receipt
  /** Sum of the item lines, which is what the totals are built from. */
  itemsSubtotal: number
}

/**
 * Read-only summary of what the receipt now adds up to. The grand total is computed
 * from the lines above it, so it always agrees with what is on screen; the figure
 * printed on the receipt is shown alongside only when the two disagree.
 */
export function ReceiptTotals({ receipt, itemsSubtotal }: ReceiptTotalsProps) {
  const computedTotal = fromCents(toCents(itemsSubtotal) + chargesCents(receipt))
  const statedTotal = toCents(receipt.total)
  const disagrees = statedTotal > 0 && statedTotal !== toCents(computedTotal)

  return (
    <Card title="Totals">
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <strong>{formatCurrency(itemsSubtotal)}</strong>
        </div>

        {CHARGE_FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.totalRow}>
            <span>{label === 'Service charge' ? 'Service' : label}</span>
            <strong>{formatCurrency(receipt[key])}</strong>
          </div>
        ))}

        <div className={`${styles.totalRow} ${styles.grand}`}>
          <span>Total</span>
          <strong>{formatCurrency(computedTotal)}</strong>
        </div>

        {disagrees && (
          <div className={`${styles.totalRow} ${styles.stated}`}>
            <span>Printed on receipt</span>
            <strong>{formatCurrency(receipt.total)}</strong>
          </div>
        )}
      </div>
    </Card>
  )
}
