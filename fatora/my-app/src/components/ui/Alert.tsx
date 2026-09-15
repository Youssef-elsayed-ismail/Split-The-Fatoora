import { cx } from '../../lib/cx.ts'
import styles from './ui.module.css'

interface AlertProps {
  variant: 'warning' | 'error'
  title?: string
  messages: string[]
}

export function Alert({ variant, title, messages }: AlertProps) {
  if (messages.length === 0) return null

  return (
    <div
      className={cx(styles.alert, variant === 'error' ? styles.alertError : styles.alertWarning)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {title && <span className={styles.alertTitle}>{title}</span>}
      {messages.length === 1 ? (
        <span>{messages[0]}</span>
      ) : (
        <ul className={styles.alertList}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
