import { useNavigate } from 'react-router-dom'
import { AssignmentCard } from '../components/assignment/AssignmentCard.tsx'
import styles from '../components/assignment/assignment.module.css'
import { ActionBar } from '../components/layout/ActionBar.tsx'
import { Screen } from '../components/layout/Screen.tsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { paths } from '../routes.ts'
import { useSplitSession } from '../state/useSplitSession.ts'

export function ItemAssignmentScreen() {
  const navigate = useNavigate()
  const { state, actions, assignmentValidation, unassignedItemIds } = useSplitSession()
  const { receipt, people, assignments } = state

  const assignEveryoneToEverything = () => {
    const everyone = people.map((person) => person.id)
    for (const item of receipt.items) {
      actions.setAssignees(item.id, everyone)
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Who had what?"
        subtitle="Tap a name for each item. Items tapped by more than one person are split evenly between them."
        backTo={paths.people}
      />

      {receipt.items.length === 0 ? (
        <EmptyState>No items on this receipt yet. Go back and add some.</EmptyState>
      ) : (
        <div className={styles.list}>
          {receipt.items.map((item) => (
            <AssignmentCard
              key={item.id}
              item={item}
              people={people}
              assigneeIds={assignments[item.id] ?? []}
              onToggle={(personId) => actions.toggleAssignee(item.id, personId)}
              onSetAssignees={(personIds) => actions.setAssignees(item.id, personIds)}
            />
          ))}
        </div>
      )}

      <ActionBar
        secondary={
          people.length > 1 && unassignedItemIds.length > 0 ? (
            <Button variant="secondary" onClick={assignEveryoneToEverything}>
              Share all
            </Button>
          ) : undefined
        }
        hint={
          assignmentValidation.isValid ? undefined : assignmentValidation.errors[0]
        }
      >
        <Button
          block
          disabled={!assignmentValidation.isValid}
          onClick={() => navigate(paths.results)}
        >
          See the split
        </Button>
      </ActionBar>
    </Screen>
  )
}
