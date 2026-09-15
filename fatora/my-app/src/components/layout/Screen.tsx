import type { ReactNode } from 'react'
import styles from './layout.module.css'

/** Vertical stack for a screen's content, with the shared entry animation. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className={styles.screen}>{children}</div>
}
