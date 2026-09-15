import { useState } from 'react'
import { cx } from '../../lib/cx.ts'
import { formatMoney } from '../../lib/money.ts'
import type { ReceiptItem } from '../../types/receipt.ts'
import { AmountField, TextField } from '../ui/Field.tsx'
import styles from './receipt.module.css'

interface ItemRowProps {
  item: ReceiptItem
  onChange: (patch: Partial<Omit<ReceiptItem, 'id'>>) => void
  onRemove: () => void
}

/**
 * One extracted item. Reads as a plain list line until you tap edit, so the
 * receipt can be skimmed rather than waded through as a wall of inputs.
 */
export function ItemRow({ item, onChange, onRemove }: ItemRowProps) {
  // A freshly added item has nothing in it yet, so open it ready to type.
  const [isEditing, setIsEditing] = useState(() => item.name.trim() === '')
  const label = item.name.trim() || 'Unnamed item'

  return (
    <div className={cx(styles.itemRow, isEditing && styles.itemRowEditing)}>
      {isEditing ? (
        <>
          <TextField
            label="Item name"
            hideLabel
            value={item.name}
            placeholder="Item name"
            onChange={(name) => onChange({ name })}
          />
          <AmountField
            label="Price"
            hideLabel
            value={item.price}
            onChange={(price) => onChange({ price })}
          />
        </>
      ) : (
        <>
          <span className={styles.itemName}>{label}</span>
          <span className={styles.itemPrice}>{formatMoney(item.price)}</span>
        </>
      )}

      <div className={styles.itemControls}>
        <button
          type="button"
          className={cx(styles.iconButton, isEditing && styles.iconButtonActive)}
          onClick={() => setIsEditing((editing) => !editing)}
          aria-pressed={isEditing}
          aria-label={isEditing ? `Finish editing ${label}` : `Edit ${label}`}
          title={isEditing ? 'Done' : 'Edit'}
        >
          {isEditing ? <CheckIcon /> : <PencilIcon />}
        </button>

        <button
          type="button"
          className={cx(styles.iconButton, styles.iconButtonDanger)}
          onClick={onRemove}
          aria-label={`Delete ${label}`}
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className={styles.icon} aria-hidden="true">
      <path d="M2.5 11.4 11 2.9a1.6 1.6 0 0 1 2.2 2.2l-8.5 8.5-2.7.6Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className={styles.icon} aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className={styles.icon} aria-hidden="true">
      <path d="M3.5 5h9m-7.5 0 .5 8.5h5L11 5M6.5 5V3.2h3V5m-2.8 3v3.2m2.6-3.2v3.2" />
    </svg>
  )
}
