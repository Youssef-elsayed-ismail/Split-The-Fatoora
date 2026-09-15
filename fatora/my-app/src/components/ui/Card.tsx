import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './ui.module.css'

interface CardProps {
  title?: string
  /** Optional control shown opposite the title, e.g. an "Add" button. */
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, action, className, children }: CardProps) {
  return (
    <section className={cx(styles.card, className)}>
      {(title || action) && (
        <header className={styles.cardTitleRow}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
