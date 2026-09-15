import { Link, useNavigate } from 'react-router-dom'
import { ReceiptVisual } from '../components/home/ReceiptVisual.tsx'
import { ScanActions } from '../components/home/ScanActions.tsx'
import styles from '../components/home/home.module.css'
import { Screen } from '../components/layout/Screen.tsx'
import { paths } from '../routes.ts'
import { useSplitSession } from '../state/useSplitSession.ts'

export function HomeScreen() {
  const navigate = useNavigate()
  const { state, actions } = useSplitSession()

  // Receipt Review owns the processing state, so this just hands off.
  const startFromImage = (image: File) => {
    actions.beginExtraction(image)
    navigate(paths.review)
  }

  const startFromScratch = () => {
    actions.startBlankReceipt()
    navigate(paths.review)
  }

  const itemCount = state.receipt.items.length

  return (
    <Screen>
      <div className={styles.home}>
        <ReceiptVisual />

        <h1 className={styles.title}>Split Fatoora</h1>
        <p className={styles.subtitle}>Split your bill. Not your friendship.</p>

        <ScanActions onReceiptReady={startFromImage} />

        {/* Only shown mid-flow, so the composition stays empty on a first visit. */}
        {state.status === 'ready' && (
          <Link className={styles.resume} to={paths.review}>
            <span className={styles.resumeLabel}>
              Continue {state.receipt.restaurantName.trim() || 'your receipt'}
            </span>
            <span className={styles.resumeMeta}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </Link>
        )}

        <button type="button" className={styles.manual} onClick={startFromScratch}>
          Enter a receipt manually
        </button>

        <p className={styles.note}>
          Your photo is read automatically. You get to check every line before splitting.
        </p>
      </div>
    </Screen>
  )
}
