import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { useSession } from '@/features/auth/AuthProvider'
import type { Entry } from '@/features/entries/cache'
import { useRealtimeEntries } from '@/features/entries/realtime'
import { useOutboxFlush } from '@/features/entries/flush'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { RegisterSheet } from '@/screens/registrar/RegisterSheet'
import { ToastProvider } from '@/ui/Toast'
import { ErrorBoundary } from './ErrorBoundary'
import { TabBar } from './TabBar'

export type ShellContext = { openRegister: (entry?: Entry) => void }

export function AppShell() {
  const [sheet, setSheet] = useState<{ entry?: Entry } | null>(null)
  const location = useLocation()
  const { session } = useSession()
  const bootstrap = useBootstrap(session?.user.id)
  useRealtimeEntries(bootstrap.data?.groupId)
  useOutboxFlush()
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
