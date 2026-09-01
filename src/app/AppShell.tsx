import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import type { Entry } from '@/features/entries/cache'
import { RegisterSheet } from '@/screens/registrar/RegisterSheet'
import { ToastProvider } from '@/ui/Toast'
import { ErrorBoundary } from './ErrorBoundary'
import { TabBar } from './TabBar'

export type ShellContext = { openRegister: (entry?: Entry) => void }

export function AppShell() {
  const [sheet, setSheet] = useState<{ entry?: Entry } | null>(null)
  const location = useLocation()
  return (
    <ToastProvider>
      <div className="min-h-dvh pb-24">
        <ErrorBoundary key={location.pathname}>
          <Outlet
            context={{ openRegister: (entry?: Entry) => setSheet({ entry }) } satisfies ShellContext}
          />
        </ErrorBoundary>
        <AnimatePresence>
          {sheet ? <RegisterSheet entry={sheet.entry} onClose={() => setSheet(null)} /> : null}
        </AnimatePresence>
        <TabBar onRegister={() => setSheet({})} />
      </div>
    </ToastProvider>
  )
}
