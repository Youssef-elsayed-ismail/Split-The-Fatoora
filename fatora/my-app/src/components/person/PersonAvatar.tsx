import { cx } from '../../lib/cx.ts'
import { personColor, personInitials } from '../../lib/personColor.ts'
import styles from './person.module.css'

interface PersonAvatarProps {
  personId: string
  name: string
  size?: 'small' | 'default'
}

export function PersonAvatar({ personId, name, size = 'default' }: PersonAvatarProps) {
  const color = personColor(personId)

  return (
    <span
      className={cx(styles.avatar, size === 'small' && styles.small)}
      style={{ background: color.background, color: color.text }}
      aria-hidden="true"
    >
      {personInitials(name)}
    </span>
  )
}
