import { useMemo, useReducer, type ReactNode } from 'react'
import {
  createEmptyReceipt,
  createItem,
  createMockPeople,
  createPerson,
} from '../data/mockReceipt.ts'
import { calculateSplit } from '../lib/calculateSplit.ts'
import {
  findUnassignedItemIds,
  validateAssignments,
  validatePeople,
  validateReceipt,
} from '../lib/validation.ts'
import { SplitSessionContext, type SplitSessionActions } from './splitSessionContext.ts'
import { createInitialState, splitSessionReducer } from './splitSessionReducer.ts'

export function SplitSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(splitSessionReducer, undefined, createInitialState)

  const actions = useMemo<SplitSessionActions>(
    () => ({
      beginExtraction: (image) =>
        dispatch({
          type: 'extracting',
          receipt: createEmptyReceipt(),
          people: createMockPeople(),
          image,
        }),
      completeExtraction: (receipt, warnings) =>
        dispatch({ type: 'extracted', receipt, warnings }),
      failExtraction: (message, canRetry) =>
        dispatch({ type: 'extractionFailed', message, canRetry }),
      retryExtraction: () => dispatch({ type: 'retryExtraction' }),
      startBlankReceipt: () =>
        dispatch({ type: 'start', receipt: createEmptyReceipt(), people: [] }),
      reset: () => dispatch({ type: 'reset', receipt: createEmptyReceipt() }),
      setText: (field, value) => dispatch({ type: 'setText', field, value }),
      setAmount: (field, value) => dispatch({ type: 'setAmount', field, value }),
      addItem: () => dispatch({ type: 'addItem', item: createItem() }),
      updateItem: (id, patch) => dispatch({ type: 'updateItem', id, patch }),
      removeItem: (id) => dispatch({ type: 'removeItem', id }),
      addPerson: () => dispatch({ type: 'addPerson', person: createPerson() }),
      renamePerson: (id, name) => dispatch({ type: 'renamePerson', id, name }),
      removePerson: (id) => dispatch({ type: 'removePerson', id }),
      toggleAssignee: (itemId, personId) => dispatch({ type: 'toggleAssignee', itemId, personId }),
      setAssignees: (itemId, personIds) => dispatch({ type: 'setAssignees', itemId, personIds }),
    }),
    [],
  )

  const value = useMemo(() => {
    const { receipt, people, assignments } = state
    return {
      state,
      actions,
      split: calculateSplit(receipt, people, assignments),
      receiptValidation: validateReceipt(receipt),
      peopleValidation: validatePeople(people),
      assignmentValidation: validateAssignments(receipt, assignments),
      unassignedItemIds: findUnassignedItemIds(receipt, assignments),
    }
  }, [state, actions])

  return <SplitSessionContext value={value}>{children}</SplitSessionContext>
}
