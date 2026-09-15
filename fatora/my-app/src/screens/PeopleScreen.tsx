import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../components/layout/ActionBar.tsx'
import { Screen } from '../components/layout/Screen.tsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.tsx'
import { PersonRow } from '../components/people/PersonRow.tsx'
import styles from '../components/people/people.module.css'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { paths } from '../routes.ts'
import { useSplitSession } from '../state/useSplitSession.ts'

export function PeopleScreen() {
  const navigate = useNavigate()
  const { state, actions, peopleValidation } = useSplitSession()
  const { people } = state

  return (
    <Screen>
      <ScreenHeader
        title="Who is splitting?"
        subtitle="Add everyone at the table. You will assign items to them next."
        backTo={paths.review}
      />

      <Card
        title={people.length === 1 ? '1 person' : `${people.length} people`}
        action={
          <Button variant="secondary" onClick={actions.addPerson}>
            Add person
          </Button>
        }
      >
        {people.length === 0 ? (
          <EmptyState>Nobody added yet. Add the first person to get started.</EmptyState>
        ) : (
          <div className={styles.list}>
            {people.map((person, index) => (
              <PersonRow
                key={person.id}
                person={person}
                index={index}
                onRename={(name) => actions.renamePerson(person.id, name)}
                onRemove={() => actions.removePerson(person.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Alert variant="error" messages={peopleValidation.errors} />

      <ActionBar>
        <Button block disabled={!peopleValidation.isValid} onClick={() => navigate(paths.assign)}>
          Continue
        </Button>
      </ActionBar>
    </Screen>
  )
}
