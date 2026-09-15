import { createEmptyReceipt } from '../data/mockReceipt.ts'
import type { Assignments, Person, Receipt, ReceiptItem } from '../types/receipt.ts'

/**
 * `idle` until a receipt is started on Home, `extracting` while the image is being
 * read, `ready` once there is something to review.
 */
export type SessionStatus = 'idle' | 'extracting' | 'ready' | 'failed'

/** Where the figures on screen came from, so the UI can be honest about them. */
export type ReceiptSource = 'manual' | 'extracted'

export interface SplitSessionState {
  status: SessionStatus
  source: ReceiptSource
  receipt: Receipt
  people: Person[]
  assignments: Assignments
  /**
   * The photo waiting to be read. Held in memory only — nothing is persisted or
   * uploaded anywhere except the app's own extraction endpoint.
   */
  pendingImage: File | null
  /** Why extraction failed, worded for the user. */
  error: string | null
  /** What the reader could not make out, for the user to fix on Receipt Review. */
  extractionWarnings: string[]
  /** False when retrying the same image cannot help, e.g. a rejected API key. */
  canRetry: boolean
}

export type TextField = 'restaurantName' | 'date'
export type AmountField =
  | 'subtotal'
  | 'vat'
  | 'taxes'
  | 'serviceCharge'
  | 'otherCharges'
  | 'total'

export type SplitSessionAction =
  | { type: 'start'; receipt: Receipt; people: Person[] }
  | { type: 'extracting'; receipt: Receipt; people: Person[]; image: File }
  | { type: 'extracted'; receipt: Receipt; warnings: string[] }
  | { type: 'extractionFailed'; message: string; canRetry: boolean }
  | { type: 'retryExtraction' }
  | { type: 'reset'; receipt: Receipt }
  | { type: 'setText'; field: TextField; value: string }
  | { type: 'setAmount'; field: AmountField; value: number }
  | { type: 'addItem'; item: ReceiptItem }
  | { type: 'updateItem'; id: string; patch: Partial<Omit<ReceiptItem, 'id'>> }
  | { type: 'removeItem'; id: string }
  | { type: 'addPerson'; person: Person }
  | { type: 'renamePerson'; id: string; name: string }
  | { type: 'removePerson'; id: string }
  | { type: 'toggleAssignee'; itemId: string; personId: string }
  | { type: 'setAssignees'; itemId: string; personIds: string[] }

export function createInitialState(): SplitSessionState {
  return {
    status: 'idle',
    source: 'manual',
    receipt: createEmptyReceipt(),
    people: [],
    assignments: {},
    pendingImage: null,
    error: null,
    extractionWarnings: [],
    canRetry: true,
  }
}

/** Blank assignment entry for every item on the receipt. */
function emptyAssignments(items: ReceiptItem[]): Assignments {
  return Object.fromEntries(items.map((item) => [item.id, []]))
}

export function splitSessionReducer(
  state: SplitSessionState,
  action: SplitSessionAction,
): SplitSessionState {
  switch (action.type) {
    case 'start':
      return {
        status: 'ready',
        source: 'manual',
        receipt: action.receipt,
        people: action.people,
        assignments: emptyAssignments(action.receipt.items),
        pendingImage: null,
        error: null,
        extractionWarnings: [],
        canRetry: true,
      }

    case 'extracting':
      return {
        status: 'extracting',
        source: 'extracted',
        receipt: action.receipt,
        people: action.people,
        assignments: {},
        pendingImage: action.image,
        error: null,
        extractionWarnings: [],
        canRetry: true,
      }

    // Extraction replaces the placeholder receipt wholesale, so assignments restart.
    case 'extracted':
      return {
        ...state,
        status: 'ready',
        source: 'extracted',
        receipt: action.receipt,
        assignments: emptyAssignments(action.receipt.items),
        pendingImage: null,
        error: null,
        extractionWarnings: action.warnings,
      }

    // The image is kept so the user can retry without picking the photo again.
    case 'extractionFailed':
      return { ...state, status: 'failed', error: action.message, canRetry: action.canRetry }

    case 'retryExtraction':
      if (!state.pendingImage) return state
      return { ...state, status: 'extracting', error: null }

    case 'reset':
      return {
        status: 'idle',
        source: 'manual',
        receipt: action.receipt,
        people: [],
        assignments: emptyAssignments(action.receipt.items),
        pendingImage: null,
        error: null,
        extractionWarnings: [],
        canRetry: true,
      }

    case 'setText':
      return { ...state, receipt: { ...state.receipt, [action.field]: action.value } }

    case 'setAmount':
      return { ...state, receipt: { ...state.receipt, [action.field]: action.value } }

    case 'addItem':
      return {
        ...state,
        receipt: { ...state.receipt, items: [...state.receipt.items, action.item] },
        assignments: { ...state.assignments, [action.item.id]: [] },
      }

    case 'updateItem':
      return {
        ...state,
        receipt: {
          ...state.receipt,
          items: state.receipt.items.map((item) =>
            item.id === action.id ? { ...item, ...action.patch } : item,
          ),
        },
      }

    case 'removeItem': {
      const { [action.id]: _removed, ...assignments } = state.assignments
      return {
        ...state,
        receipt: {
          ...state.receipt,
          items: state.receipt.items.filter((item) => item.id !== action.id),
        },
        assignments,
      }
    }

    case 'addPerson':
      return { ...state, people: [...state.people, action.person] }

    case 'renamePerson':
      return {
        ...state,
        people: state.people.map((person) =>
          person.id === action.id ? { ...person, name: action.name } : person,
        ),
      }

    case 'removePerson': {
      // Drop the person everywhere, including from items they were sharing.
      const assignments: Assignments = {}
      for (const [itemId, personIds] of Object.entries(state.assignments)) {
        assignments[itemId] = personIds.filter((id) => id !== action.id)
      }
      return {
        ...state,
        people: state.people.filter((person) => person.id !== action.id),
        assignments,
      }
    }

    case 'toggleAssignee': {
      const current = state.assignments[action.itemId] ?? []
      const next = current.includes(action.personId)
        ? current.filter((id) => id !== action.personId)
        : [...current, action.personId]
      return { ...state, assignments: { ...state.assignments, [action.itemId]: next } }
    }

    case 'setAssignees':
      return {
        ...state,
        assignments: { ...state.assignments, [action.itemId]: [...new Set(action.personIds)] },
      }

    default:
      return state
  }
}
