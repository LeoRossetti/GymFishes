import { useSyncExternalStore } from 'react'

type InstallEvent = Event & { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> }
export type InstallPrompt = { install: (() => Promise<void>) | null; iphone: boolean }

function standalone(): boolean {
  const media = typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches
  return media || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIphone(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent)
}

// Chrome fires `beforeinstallprompt` once per page load, early, while the app is still on Hoje.
// So the event is kept at module scope, not in a hook: this module is imported eagerly through
// routes.tsx -> Perfil, which attaches the listeners at app start, long before Perfil opens.
// We never preventDefault, so the browser's own install UI stays.
let deferred: InstallEvent | null = null
const subscribers = new Set<() => void>()

function set(event: InstallEvent | null) {
  deferred = event
  subscribers.forEach((notify) => notify())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => set(e as InstallEvent))
  window.addEventListener('appinstalled', () => set(null))
}

function subscribe(notify: () => void) {
  subscribers.add(notify)
  return () => {
    subscribers.delete(notify)
  }
}

/** Tests only: the store is module state, so it must be cleared between tests. */
export function __resetInstallStore() {
  deferred = null
}

/** Install plumbing: spend the kept event on the user's tap. iPhone Safari never fires it, so `iphone` drives a hint. */
export function useInstallPrompt(): InstallPrompt {
  const event = useSyncExternalStore(subscribe, () => deferred)
  const installed = standalone()
  const install =
    event && !installed
      ? async () => {
          set(null)
          try {
            await event.prompt()
          } catch {
            /* dismissed or unsupported */
          }
        }
      : null
  return { install, iphone: !installed && isIphone() }
}
