import '@fontsource/nunito/latin-500.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CelebrationScreen } from '@/features/celebrations/CelebrationScreen'
import type { FullScreenCelebration } from '@/features/celebrations/engine'

declare global {
  interface Window {
    /** Mounts the celebration; `celebration-shots.mjs` calls it so the recording starts on cue. */
    __start?: () => void
  }
}

/** One sample per full-screen celebration (spec §7), the way a register would raise it. */
const SAMPLES: Record<string, FullScreenCelebration> = {
  unlock: { kind: 'unlock', fish: 'tambaqui' },
  record: { kind: 'record', ml: 4200 },
  streak: { kind: 'streak', days: 7 },
}

const kind = new URLSearchParams(location.search).get('kind') ?? 'unlock'
const celebration = SAMPLES[kind] ?? SAMPLES.unlock!

function Stage() {
  const [shown, setShown] = useState(false)
  window.__start = () => setShown(true)
  return shown ? <CelebrationScreen celebration={celebration} onClose={() => {}} onChoose={() => {}} /> : null
}

createRoot(document.getElementById('root')!).render(<Stage />)
