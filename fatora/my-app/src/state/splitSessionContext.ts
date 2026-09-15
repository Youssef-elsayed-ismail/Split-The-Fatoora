import { createContext } from 'react'
import type { Receipt, ReceiptItem } from '../types/receipt.ts'
import type { SplitResult } from '../types/split.ts'
import type { StepValidation } from '../lib/validation.ts'
import type { AmountField, SplitSessionState, TextField } from './splitSessionReducer.ts'

export interface SplitSessionActions {
  /** Moves to the processing state; Receipt Review then drives the extraction. */
  beginExtraction: (image: File) => void
  completeExtraction: (receipt: Receipt, warnings: string[]) => void
  failExtraction: (message: string, canRetry: boolean) => void
  /** Re-reads the image already in hand after a failure. */
  retryExtraction: () => void
  startBlankReceipt: () => void
  reset: () => void
  setText: (field: TextField, value: string) => void
  setAmount: (field: AmountField, value: number) => void
  addItem: () => void
  updateItem: (id: string, patch: Partial<Omit<ReceiptItem, 'id'>>) => void
  removeItem: (id: string) => void
  addPerson: () => void
  renamePerson: (id: string, name: string) => void
  removePerson: (id: string) => void
  toggleAssignee: (itemId: string, personId: string) => void
  setAssignees: (itemId: string, personIds: string[]) => void
}

export interface SplitSessionValue {
  state: SplitSessionState
  split: SplitResult
  receiptValidation: StepValidation
  peopleValidation: StepValidation
  assignmentValidation: StepValidation
  unassignedItemIds: string[]
  actions: SplitSessionActions
}

export const SplitSessionContext = createContext<SplitSessionValue | null>(null)
