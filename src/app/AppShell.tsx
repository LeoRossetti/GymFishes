import { Outlet } from 'react-router'
import { ErrorBoundary } from './ErrorBoundary'
import { TabBar } from './TabBar'

export function AppShell() {
  return (
    <div className="min-h-dvh pb-24">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <TabBar />
    </div>
  )
}
