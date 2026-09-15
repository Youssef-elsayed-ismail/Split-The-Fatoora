import { useState } from 'react'
import { cx } from '../../lib/cx.ts'
import { formatMoney, parseAmount } from '../../lib/money.ts'
import styles from './ui.module.css'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date'
  /** Hides the visible label but keeps it for screen readers, for use inside compact rows. */
  hideLabel?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hideLabel = false,
}: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span className={hideLabel ? 'visually-hidden' : styles.label}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

interface AmountFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  /** Hides the visible label but keeps it for screen readers, for use inside table-like rows. */
  hideLabel?: boolean
}

export function AmountField({
  label,
  value,
  onChange,
  placeholder = '0.00',
  hideLabel = false,
}: AmountFieldProps) {
  // While the field is being edited we show exactly what was typed, so partial
  // entries like "12." survive the keystroke instead of snapping back to a number.
  // Once focus leaves, the value settles into proper money formatting.
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === 0 ? '' : formatMoney(value))

  return (
    <label className={styles.field}>
      <span className={hideLabel ? 'visually-hidden' : styles.label}>{label}</span>
      <input
        className={cx(styles.input, styles.alignRight)}
        type="text"
        inputMode="decimal"
        value={display}
        placeholder={placeholder}
        onChange={(event) => {
          setDraft(event.target.value)
          onChange(parseAmount(event.target.value))
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  )
}
