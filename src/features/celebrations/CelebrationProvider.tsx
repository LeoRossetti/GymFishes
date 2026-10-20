import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/features/entries/cache'
import { ALL_FISH_AVAILABLE, type FishId } from '@/features/fish/catalog'
import { useGroupData } from '@/features/group/useGroupData'
import { updateProfile } from '@/features/profile/mutations'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import { useToast } from '@/ui/Toast'
import { CelebrationScreen } from './CelebrationScreen'
import { dayStateOf } from './dayState'
import { celebrationText, celebrationsFor, present, type FullScreenCelebration } from './engine'
import { loadSeenUnlocks, saveSeenUnlocks } from './seenUnlocks'

type Celebrations = {
  /** Call with the entries mirror before and after one of *your* inserts (spec §7). */
  celebrate: (before: readonly Entry[], after: readonly Entry[]) => void
  /** The round-litre caption while it is showing — Hoje puts it on the gap line. */
  inline: string | null
}

const CelebrationContext = createContext<Celebrations>({ celebrate: () => {}, inline: null })

export function useCelebrations(): Celebrations {
  return useContext(CelebrationContext)
}

/** How long "2 L hoje" replaces the gap line. */
const INLINE_MS = 2500

/**
 * Runs the engine after each of your registers and owns what it shows: at most one full screen,
 * the rest as one joined toast, the lone round litre inline. `seen_unlocks` (per device) is what
 * makes "exactly once" hold across sessions; it seeds itself the first time it is needed, so a
 * fresh device never re-celebrates fish you already have.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { userId, members } = useGroupData()
  const client = useQueryClient()
  const toast = useToast()
  const [full, setFull] = useState<FullScreenCelebration | null>(null)
  const [inline, setInline] = useState<string | null>(null)
  const inlineTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(inlineTimer.current), [])

  const celebrate = useCallback(
    (before: readonly Entry[], after: readonly Entry[]) => {
      if (!userId) return
      const today = dayKey(new Date())
      const ids = members.map((m) => m.id)
      const b = dayStateOf(before, ids, userId, today)
      const a = dayStateOf(after, ids, userId, today)
      // A fish counts as seen only if it was unlocked before this register: the phones stored all
      // thirteen while every fish was open (2026-09-24), and that must not silence the achievements.
      // While every fish is available there is nothing new to celebrate at all.
      const stored = loadSeenUnlocks() ?? b.unlocked
      const seen = ALL_FISH_AVAILABLE ? a.unlocked : new Set([...stored].filter((f) => b.unlocked.has(f)))
      const shown = present(celebrationsFor({ ...b, unlocked: seen }, a))
      saveSeenUnlocks(new Set([...seen, ...a.unlocked]))
      if (shown.fullScreen) setFull(shown.fullScreen)
      if (shown.toasts.length > 0) toast(shown.toasts.map(celebrationText).join(STRINGS.celebracoes.separador))
      if (shown.inline) {
        setInline(celebrationText(shown.inline))
        window.clearTimeout(inlineTimer.current)
        inlineTimer.current = window.setTimeout(() => setInline(null), INLINE_MS)
      }
    },
    [userId, members, toast],
  )

  const close = useCallback(() => setFull(null), [])

  async function choose(fish: FishId) {
    setFull(null)
    if (!userId) return
    try {
      await updateProfile(userId, { fish_variant: fish })
      await client.invalidateQueries({ queryKey: ['bootstrap'] })
      await client.invalidateQueries({ queryKey: ['members'] })
    } catch {
      toast(STRINGS.erro.generico)
    }
  }

  const value = useMemo(() => ({ celebrate, inline }), [celebrate, inline])
  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {full ? <CelebrationScreen celebration={full} onClose={close} onChoose={choose} /> : null}
    </CelebrationContext.Provider>
  )
}
