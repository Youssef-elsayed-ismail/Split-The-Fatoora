import { formatCurrency, toCents } from '../../lib/money.ts'
import { CHARGE_FIELDS, type Receipt } from '../../types/receipt.ts'
import type { SplitResult } from '../../types/split.ts'
import { Card } from '../ui/Card.tsx'
import styles from './results.module.css'

interface TotalsCardProps {
  receipt: Receipt
  split: SplitResult
}

export function TotalsCard({ receipt, split }: TotalsCardProps) {
  const printedTotal = toCents(receipt.total)
  const matchesReceipt = printedTotal > 0 && printedTotal === toCents(split.splitTotal)

  return (
    <Card title="Totals">
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Items</span>
          <strong>{formatCurrency(split.assignedSubtotal)}</strong>
        </div>
        {CHARGE_FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.totalRow}>
            <span>{label}</span>
            <strong>{formatCurrency(receipt[key])}</strong>
          </div>
        ))}
        <div className={`${styles.totalRow} ${styles.grand}`}>
          <span>Split across everyone</span>
          <strong>{formatCurrency(split.splitTotal)}</strong>
        </div>
        {printedTotal > 0 && !matchesReceipt && (
          <div className={styles.totalRow}>
            <span>Receipt total</span>
            <strong>{formatCurrency(receipt.total)}</strong>
          </div>
        )}
      </div>
    </Card>
  )
}
