import { useNavigate } from 'react-router-dom'
import styles from './layout.module.css'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  /** Where the back link goes. Omit to hide it. */
  backTo?: string
}

export function ScreenHeader({ title, subtitle, backTo }: ScreenHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      {backTo && (
        <button type="button" className={styles.back} onClick={() => navigate(backTo)}>
          ← Back
        </button>
      )}
      <h2>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  )
}
