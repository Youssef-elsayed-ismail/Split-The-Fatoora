import { Navigate, Outlet } from 'react-router-dom'
import { paths } from '../../routes.ts'
import { useSplitSession } from '../../state/useSplitSession.ts'

/** Keeps the later steps out of reach until a receipt has been started on Home. */
export function RequireReceipt() {
  const { state } = useSplitSession()
  return state.status === 'idle' ? <Navigate to={paths.home} replace /> : <Outlet />
}
