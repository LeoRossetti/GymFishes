import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { useSession } from '@/features/auth/AuthProvider'
import { CelebrationProvider } from '@/features/celebrations/CelebrationProvider'
import type { Entry } from '@/features/entries/cache'
import { useRealtimeEntries } from '@/features/entries/realtime'
import { useOutboxFlush } from '@/features/entries/flush'
import { useAppUpdate } from '@/features/pwa/registerSW'
import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { RegisterSheet } from '@/screens/registrar/RegisterSheet'
import { ToastProvider } from '@/ui/Toast'
import { ErrorBoundary } from './ErrorBoundary'
import { TabBar } from './TabBar'

export type ShellContext = { openRegister: (entry?: Entry) => void }

/**
 * The frame (spec M7 §4): a flex column filling `#root`. The screen scrolls inside `<main>`;
 * the update bar and the tab bar are ordinary siblings below it, so nothing is fixed to the
 * window and iOS standalone has no document to rubber-band. Sheets and celebrations stay
 * fixed overlays on top.
 */
export function AppShell() {
  const [sheet, setSheet] = useState<{ entry?: Entry } | null>(null)
  const location = useLocation()
  const { session } = useSession()
  const bootstrap = useBootstrap(session?.user.id)
  useRealtimeEntries(bootstrap.data?.groupId)
  useOutboxFlush()
  const update = useAppUpdate()
  return (
    <ToastProvider>
      <CelebrationProvider>
        <div className="flex min-h-0 flex-1 flex-col">
          <main className="scroll-region">
            <ErrorBoundary key={location.pathname}>
              <Outlet
                context={{ openRegister: (entry?: Entry) => setSheet({ entry }) } satisfies ShellContext}
              />
            </ErrorBoundary>
          </main>
          {/* A waiting build applies itself on the next cold open anyway, so the login screen needs no bar. */}
          <UpdatePrompt {...update} />
          <AnimatePresence>
            {sheet ? <RegisterSheet entry={sheet.entry} onClose={() => setSheet(null)} /> : null}
          </AnimatePresence>
          <TabBar onRegister={() => setSheet({})} />
        </div>
      </CelebrationProvider>
    </ToastProvider>
  )
}
