import { useContext } from 'react'
import { SplitSessionContext, type SplitSessionValue } from './splitSessionContext.ts'

export function useSplitSession(): SplitSessionValue {
  const value = useContext(SplitSessionContext)
  if (!value) {
    throw new Error('useSplitSession must be used inside <SplitSessionProvider>')
  }
  return value
}
