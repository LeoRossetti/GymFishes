import { useEffect, useState } from 'react'

type InstallEvent = Event & { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> }
export type InstallPrompt = { install: (() => Promise<void>) | null; iphone: boolean }

function standalone(): boolean {
  const media = typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches
  return media || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIphone(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent)
}

/**
 * Install plumbing. Chrome fires `beforeinstallprompt` once it deems the app installable;
 * we keep the event (without preventDefault, so its own install UI stays) and spend it on
 * the user's tap. iPhone Safari never fires it, so `iphone` drives a hint instead.
 */
export function useInstallPrompt(): InstallPrompt {
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => setEvent(e as InstallEvent)
    const onInstalled = () => setEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const installed = standalone()
  const install =
    event && !installed
      ? async () => {
          setEvent(null)
          await event.prompt()
        }
      : null
  return { install, iphone: !installed && isIphone() }
}
