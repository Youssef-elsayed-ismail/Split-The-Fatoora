import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../components/layout/ActionBar.tsx'
import { Screen } from '../components/layout/Screen.tsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.tsx'
import { ShareCard } from '../components/results/ShareCard.tsx'
import styles from '../components/results/results.module.css'
import { TotalsCard } from '../components/results/TotalsCard.tsx'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { formatCurrency } from '../lib/money.ts'
import { paths } from '../routes.ts'
import { useSplitSession } from '../state/useSplitSession.ts'

export function ResultsScreen() {
  const navigate = useNavigate()
  const { state, split, actions } = useSplitSession()
  const { receipt } = state

  const startOver = () => {
    actions.reset()
    navigate(paths.home)
  }

  const warnings =
    split.unassignedSubtotal > 0
      ? [
          `${formatCurrency(split.unassignedSubtotal)} of items are not assigned to anyone, so they are left out of the split.`,
        ]
      : []

  return (
    <Screen>
      <ScreenHeader
        title="Here's the split"
        subtitle={
          receipt.restaurantName
            ? `${receipt.restaurantName} · ${formatCurrency(split.splitTotal)} across ${split.shares.length} ${split.shares.length === 1 ? 'person' : 'people'}`
            : `${formatCurrency(split.splitTotal)} across ${split.shares.length} ${split.shares.length === 1 ? 'person' : 'people'}`
        }
        backTo={paths.assign}
      />

      <Alert variant="warning" messages={warnings} />

      <div className={styles.list}>
        {split.shares.map((share) => (
          <ShareCard key={share.personId} share={share} />
        ))}
      </div>

      <TotalsCard receipt={receipt} split={split} />

      <ActionBar
        secondary={
          <Button variant="secondary" onClick={() => navigate(paths.assign)}>
            Edit
          </Button>
        }
      >
        <Button block onClick={startOver}>
          Split another receipt
        </Button>
      </ActionBar>
    </Screen>
  )
}
