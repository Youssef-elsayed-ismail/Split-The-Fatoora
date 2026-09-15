import { Card } from '../ui/Card.tsx'
import styles from './receipt.module.css'

/** Placeholder lines, sized unevenly so the block reads as text rather than a bar chart. */
const SKELETON_WIDTHS = ['72%', '54%', '63%', '46%']

interface ReceiptProcessingProps {
  /** When extraction is faked, say so instead of claiming the photo is being read. */
  isMocked?: boolean
}

/** Shown while the receipt is being prepared, before there is anything to review. */
export function ReceiptProcessing({ isMocked = false }: ReceiptProcessingProps) {
  const title = isMocked ? 'Setting up a sample receipt…' : 'Reading your receipt…'

  return (
    <Card className={styles.processing}>
      <div className={styles.processingHead}>
        <span className={styles.scanner} aria-hidden="true">
          <span className={styles.scannerLine} />
        </span>
        <h3 className={styles.processingTitle}>{title}</h3>
        <p className={styles.processingHint}>
          {isMocked
            ? 'Reading receipts automatically is not built yet, so you will get placeholder figures to edit.'
            : 'Pulling out the items and charges. This only takes a moment.'}
        </p>
      </div>

      <div className={styles.skeletonList} role="status" aria-label={title}>
        {SKELETON_WIDTHS.map((width, index) => (
          <span
            key={width}
            className={styles.skeleton}
            style={{ width, animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
    </Card>
  )
}
