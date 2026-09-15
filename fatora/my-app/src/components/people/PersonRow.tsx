import type { Person } from '../../types/receipt.ts'
import { PersonAvatar } from '../person/PersonAvatar.tsx'
import { Button } from '../ui/Button.tsx'
import { TextField } from '../ui/Field.tsx'
import styles from './people.module.css'

interface PersonRowProps {
  person: Person
  index: number
  onRename: (name: string) => void
  onRemove: () => void
}

export function PersonRow({ person, index, onRename, onRemove }: PersonRowProps) {
  return (
    <div className={styles.row}>
      <PersonAvatar personId={person.id} name={person.name || String(index + 1)} />
      <div className={styles.nameField}>
        <TextField
          label={`Person ${index + 1} name`}
          hideLabel
          value={person.name}
          placeholder={`Person ${index + 1}`}
          onChange={onRename}
        />
      </div>
      <Button variant="danger" onClick={onRemove} aria-label={`Remove ${person.name || 'person'}`}>
        Remove
      </Button>
    </div>
  )
}
