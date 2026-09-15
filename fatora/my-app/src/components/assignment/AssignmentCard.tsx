import { cx } from '../../lib/cx.ts'
import { formatCurrency, formatMoney } from '../../lib/money.ts'
import type { Person, ReceiptItem } from '../../types/receipt.ts'
import { PersonAvatar } from '../person/PersonAvatar.tsx'
import styles from './assignment.module.css'

interface AssignmentCardProps {
  item: ReceiptItem
  people: Person[]
  assigneeIds: string[]
  onToggle: (personId: string) => void
  onSetAssignees: (personIds: string[]) => void
}

export function AssignmentCard({
  item,
  people,
  assigneeIds,
  onToggle,
  onSetAssignees,
}: AssignmentCardProps) {
  const everyoneSelected = people.length > 0 && assigneeIds.length === people.length
  const perPerson = assigneeIds.length > 0 ? item.price / assigneeIds.length : 0

  return (
    <article className={cx(styles.card, assigneeIds.length === 0 && styles.unassigned)}>
      <div className={styles.head}>
        <span className={styles.name}>{item.name || 'Unnamed item'}</span>
        <span className={styles.price}>{formatCurrency(item.price)}</span>
      </div>

      <div className={styles.chips}>
        {people.map((person) => {
          const selected = assigneeIds.includes(person.id)
          return (
            <button
              key={person.id}
              type="button"
              className={cx(styles.chip, selected && styles.chipSelected)}
              aria-pressed={selected}
              onClick={() => onToggle(person.id)}
            >
              <PersonAvatar personId={person.id} name={person.name} size="small" />
              {person.name || 'Unnamed'}
            </button>
          )
        })}

        {people.length > 1 && (
          <button
            type="button"
            className={cx(styles.chip, styles.everyone, everyoneSelected && styles.chipSelected)}
            aria-pressed={everyoneSelected}
            onClick={() =>
              onSetAssignees(everyoneSelected ? [] : people.map((person) => person.id))
            }
          >
            Everyone
          </button>
        )}
      </div>

      {assigneeIds.length > 1 && (
        <p className={styles.share}>
          {formatMoney(perPerson)} each, split {assigneeIds.length} ways
        </p>
      )}
    </article>
  )
}
