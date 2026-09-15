import type { ReactNode } from 'react'
import styles from './layout.module.css'

interface ActionBarProps {
  /** The one obvious primary action for the screen. */
  children: ReactNode
  /** Optional secondary control, placed before the primary action. */
  secondary?: ReactNode
  /** Short explanation shown under the action, e.g. why it is disabled. */
  hint?: string
}

export function ActionBar({ children, secondary, hint }: ActionBarProps) {
  return (
    <div className={styles.actions}>
      <div className={styles.actionsRow}>
        {secondary}
        {children}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
