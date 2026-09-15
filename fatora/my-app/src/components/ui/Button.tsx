import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './ui.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Full-width, for the primary action at the bottom of a screen. */
  block?: boolean
}

export function Button({
  variant = 'primary',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], block && styles.block, className)}
      {...rest}
    />
  )
}
