import { useRef, type ChangeEvent } from 'react'
import { Button } from '../ui/Button.tsx'
import styles from './home.module.css'

interface ScanActionsProps {
  /** Called with the picked image. Receipt Review reads it and shows progress. */
  onReceiptReady: (image: File) => void
}

export function ScanActions({ onReceiptReady }: ScanActionsProps) {
  const scanRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    // Let the same photo be chosen twice in a row.
    event.target.value = ''
    if (picked) onReceiptReady(picked)
  }

  return (
    <div className={styles.actions}>
      <Button block className={styles.scan} onClick={() => scanRef.current?.click()}>
        Scan Receipt
      </Button>

      <Button
        block
        variant="secondary"
        className={styles.upload}
        onClick={() => uploadRef.current?.click()}
      >
        Upload Receipt
      </Button>

      {/* `capture` asks the device to open its camera straight away; browsers
          without a camera fall back to the normal file picker. */}
      <input
        ref={scanRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />
      <input ref={uploadRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}
