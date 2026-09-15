
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { RequireReceipt } from './components/layout/RequireReceipt.tsx'
import { paths } from './routes.ts'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { ItemAssignmentScreen } from './screens/ItemAssignmentScreen.tsx'
import { PeopleScreen } from './screens/PeopleScreen.tsx'
import { ReceiptReviewScreen } from './screens/ReceiptReviewScreen.tsx'
import { ResultsScreen } from './screens/ResultsScreen.tsx'
import { SplitSessionProvider } from './state/SplitSessionProvider.tsx'

export default function App() {
  return (
    <SplitSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={paths.home} element={<HomeScreen />} />
            <Route element={<RequireReceipt />}>
              <Route path={paths.review} element={<ReceiptReviewScreen />} />
              <Route path={paths.people} element={<PeopleScreen />} />
              <Route path={paths.assign} element={<ItemAssignmentScreen />} />
              <Route path={paths.results} element={<ResultsScreen />} />
            </Route>
            <Route path="*" element={<Navigate to={paths.home} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SplitSessionProvider>
  )
}
