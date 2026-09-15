import { CURRENCY, formatMoney } from '../../lib/money.ts'
import type { PersonShare } from '../../types/split.ts'
import { PersonAvatar } from '../person/PersonAvatar.tsx'
import styles from './results.module.css'

const LINES = [
  { key: 'itemSubtotal', label: 'Items' },
  { key: 'vat', label: 'VAT' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'serviceCharge', label: 'Service' },
  { key: 'otherCharges', label: 'Other' },
] as const

export function ShareCard({ share }: { share: PersonShare }) {
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <PersonAvatar personId={share.personId} name={share.name} />
        <span className={styles.name}>{share.name || 'Unnamed'}</span>
        <span className={styles.amount}>
          {formatMoney(share.total)}
          <span className={styles.currency}>{CURRENCY}</span>
        </span>
      </div>

      <dl className={styles.breakdown}>
        {LINES.map((line) => (
          <div key={line.key} className={styles.line}>
            <dt className={styles.lineLabel}>{line.label}</dt>
            <dd className={styles.lineValue}>{formatMoney(share[line.key])}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
