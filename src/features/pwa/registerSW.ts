import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export type AppUpdate = { ready: boolean; apply: () => Promise<void> }

/**
 * Update plumbing (spec §9). The waiting worker never takes over on its own — a reload
 * mid-register would drop the draft — so `ready` only surfaces the fact and `apply`
 * acts on the user's tap. New builds are looked for when the app comes back to the
 * foreground, the same trigger family as the outbox flush.
 */
export function useAppUpdate(): AppUpdate {
  const {
    needRefresh: [ready],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update())
    }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])

  return { ready, apply: () => updateServiceWorker(true) }
}
