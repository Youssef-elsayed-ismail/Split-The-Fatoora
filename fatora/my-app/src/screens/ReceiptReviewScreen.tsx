import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXTRACTION_IS_MOCKED, ExtractionFailed, extractReceipt } from '../data/extractReceipt.ts'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { ActionBar } from '../components/layout/ActionBar.tsx'
import { Screen } from '../components/layout/Screen.tsx'
import { ScreenHeader } from '../components/layout/ScreenHeader.tsx'
import { ItemRow } from '../components/receipt/ItemRow.tsx'
import { ReceiptProcessing } from '../components/receipt/ReceiptProcessing.tsx'
import { ReceiptTotals } from '../components/receipt/ReceiptTotals.tsx'
import styles from '../components/receipt/receipt.module.css'
import { Alert } from '../components/ui/Alert.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Card } from '../components/ui/Card.tsx'
import { AmountField, TextField } from '../components/ui/Field.tsx'
import { formatCurrency, toCents } from '../lib/money.ts'
import { paths } from '../routes.ts'
import { CHARGE_FIELDS } from '../types/receipt.ts'
import { useSplitSession } from '../state/useSplitSession.ts'

export function ReceiptReviewScreen() {
  const navigate = useNavigate()
  const { state, actions, receiptValidation, split } = useSplitSession()
  const { receipt, status, source, pendingImage, error, extractionWarnings, canRetry } = state
  const showsSampleData = EXTRACTION_IS_MOCKED && source === 'extracted'

  // Extraction runs here rather than on Home, so the processing state has a screen
  // to live on and a slow read cannot leave Home stuck.
  useEffect(() => {
    if (status !== 'extracting' || !pendingImage) return

    let cancelled = false

    void extractReceipt(pendingImage)
      .then(({ receipt: extracted, warnings }) => {
        // A partial read still lands here, warnings and all — never a dead end.
        if (!cancelled) actions.completeExtraction(extracted, warnings)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (cause instanceof ExtractionFailed) {
          actions.failExtraction(cause.message, cause.retryable)
        } else {
          actions.failExtraction('Something went wrong reading that receipt.', true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [status, pendingImage, actions])

  if (status === 'extracting') {
    return (
      <Screen>
        <ScreenHeader title="Reading the receipt" backTo={paths.home} />
        <ReceiptProcessing isMocked={EXTRACTION_IS_MOCKED} />
      </Screen>
    )
  }

  if (status === 'failed') {
    const retryable = canRetry && pendingImage !== null

    // Entering it by hand is always available, so a failed read never dead-ends.
    return (
      <Screen>
        <ScreenHeader title="That photo could not be read" backTo={paths.home} />
        <Card>
          <EmptyState>{error ?? 'The receipt could not be read.'}</EmptyState>
        </Card>
        <ActionBar
          secondary={
            retryable ? (
              <Button variant="secondary" onClick={actions.retryExtraction}>
                Try again
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate(paths.home)}>
                Another photo
              </Button>
            )
          }
        >
          <Button block onClick={actions.startBlankReceipt}>
            Enter it by hand
          </Button>
        </ActionBar>
      </Screen>
    )
  }

  const subtotalMismatch =
    toCents(receipt.subtotal) > 0 &&
    toCents(receipt.subtotal) !== toCents(split.itemsSubtotal)

  return (
    <Screen>
      <ScreenHeader
        title="Check the receipt"
        subtitle="Fix anything that looks wrong before splitting. Charges are shared out based on what each person ordered."
        backTo={paths.home}
      />

      {showsSampleData && (
        <Alert
          variant="warning"
          title="Sample data"
          messages={[
            'Your photo has not been read — reading receipts automatically is not built yet, so these are placeholder figures. Edit them to match your receipt before continuing.',
          ]}
        />
      )}

      {/* What the reader could not make out. Never blocks; everything below is editable. */}
      <Alert
        variant="warning"
        title="Check these — the photo was not fully readable"
        messages={extractionWarnings}
      />

      <Card title="Receipt">
        <div className={styles.grid}>
          <TextField
            label="Restaurant"
            value={receipt.restaurantName}
            placeholder="Where you ate"
            onChange={(value) => actions.setText('restaurantName', value)}
          />
          <TextField
            label="Date"
            type="date"
            value={receipt.date}
            onChange={(value) => actions.setText('date', value)}
          />
        </div>
      </Card>

      <Card
        title="Items"
        action={
          <Button variant="secondary" onClick={actions.addItem}>
            Add item
          </Button>
        }
      >
        {receipt.items.length === 0 ? (
          <p className={styles.noItems}>No items yet — add the first one.</p>
        ) : (
          <div className={styles.itemList}>
            {receipt.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onChange={(patch) => actions.updateItem(item.id, patch)}
                onRemove={() => actions.removeItem(item.id)}
              />
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerLabel}>Items add up to</span>
          <span className={styles.footerValue}>{formatCurrency(split.itemsSubtotal)}</span>
        </div>
      </Card>

      <Card title="Charges">
        <div className={styles.chargeGrid}>
          <AmountField
            label="Subtotal on receipt"
            value={receipt.subtotal}
            onChange={(value) => actions.setAmount('subtotal', value)}
          />
          {CHARGE_FIELDS.map(({ key, label }) => (
            <AmountField
              key={key}
              label={label}
              value={receipt[key]}
              onChange={(value) => actions.setAmount(key, value)}
            />
          ))}
          <AmountField
            label="Total on receipt"
            value={receipt.total}
            onChange={(value) => actions.setAmount('total', value)}
          />
        </div>

        {subtotalMismatch && (
          <div className={styles.fixRow}>
            <Button
              variant="secondary"
              onClick={() => actions.setAmount('subtotal', split.itemsSubtotal)}
            >
              Set subtotal to {formatCurrency(split.itemsSubtotal)}
            </Button>
          </div>
        )}
      </Card>

      <ReceiptTotals receipt={receipt} itemsSubtotal={split.itemsSubtotal} />

      <Alert variant="warning" title="Worth a look" messages={receiptValidation.warnings} />
      <Alert variant="error" messages={receiptValidation.errors} />

      <ActionBar hint={receiptValidation.isValid ? undefined : receiptValidation.errors[0]}>
        <Button block disabled={!receiptValidation.isValid} onClick={() => navigate(paths.people)}>
          Continue
        </Button>
      </ActionBar>
    </Screen>
  )
}
