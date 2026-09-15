import { Outlet, useLocation } from 'react-router-dom'
import { flowSteps, paths, stepNumber } from '../../routes.ts'
import styles from './layout.module.css'

export function AppLayout() {
  const { pathname } = useLocation()
  const current = stepNumber(pathname)
  const showProgress = pathname !== paths.home && current > 0

  return (
    <div className={styles.shell}>
      <main className={styles.container}>
        {showProgress && (
          <div className={styles.progress}>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${(current / flowSteps.length) * 100}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              Step {current} of {flowSteps.length}
            </span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
