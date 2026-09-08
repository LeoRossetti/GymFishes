import { FISH_IDS, STREAK_MILESTONES, fishName, type FishId } from '@/features/fish/catalog'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/** "Your day" as the engine sees it. Built by `dayState.ts` before and after a register. */
export type DayState = {
  todayMl: number
  /** Your best day before today, 0 when there is none — the bar a record has to clear. */
  bestOtherDayMl: number
  /** Ahead of a partner who has registered today (spec §7 "took the lead"). */
  leading: boolean
  streakDays: number
  unlocked: ReadonlySet<FishId>
}

export type Celebration =
  | { kind: 'unlock'; fish: FishId }
  | { kind: 'record'; ml: number }
  | { kind: 'streak'; days: number }
  | { kind: 'lead' }
  | { kind: 'litre'; litres: number }

export type FullScreenCelebration = Extract<Celebration, { kind: 'unlock' | 'record' | 'streak' }>

function isFullScreen(c: Celebration): c is FullScreenCelebration {
  return c.kind === 'unlock' || c.kind === 'record' || c.kind === 'streak'
}

/** Everything one register earned, in spec §7 priority order: unlock > record > streak > lead > litre. */
export function celebrationsFor(before: DayState, after: DayState): Celebration[] {
  const out: Celebration[] = []
  for (const fish of FISH_IDS) {
    if (after.unlocked.has(fish) && !before.unlocked.has(fish)) out.push({ kind: 'unlock', fish })
  }
  const bar = after.bestOtherDayMl
  if (bar > 0 && before.todayMl <= bar && after.todayMl > bar) out.push({ kind: 'record', ml: after.todayMl })
  const days = STREAK_MILESTONES.findLast((m) => before.streakDays < m && after.streakDays >= m)
  if (days !== undefined) out.push({ kind: 'streak', days })
  if (!before.leading && after.leading) out.push({ kind: 'lead' })
  const litres = Math.floor(after.todayMl / 1000)
  const beforeLitres = Math.floor(before.todayMl / 1000)
  const litreIncrease = litres - beforeLitres
  const hasNoPreviousBest = after.bestOtherDayMl === 0
  if ((hasNoPreviousBest && litreIncrease === 1) || (!hasNoPreviousBest && litreIncrease >= 2)) {
    out.push({ kind: 'litre', litres })
  }
  return out
}

export type Presentation = {
  fullScreen: FullScreenCelebration | null
  toasts: Celebration[]
  inline: Celebration | null
}

/**
 * Spec §7 rules: one full screen at most; outranked full-screen kinds degrade to toasts; the
 * lead is a toast by nature; the round litre is inline and is dropped when anything outranks it.
 */
export function present(cels: readonly Celebration[]): Presentation {
  const [fullScreen = null, ...demoted] = cels.filter(isFullScreen)
  const toasts: Celebration[] = [...demoted, ...cels.filter((c) => c.kind === 'lead')]
  const only = cels.length === 1 ? cels[0] : undefined
  return { fullScreen, toasts, inline: only?.kind === 'litre' ? only : null }
}

export function celebrationText(c: Celebration): string {
  switch (c.kind) {
    case 'unlock':
      return `${STRINGS.celebracoes.novoPeixe} ${fishName(c.fish)}`
    case 'record':
      return STRINGS.celebracoes.novoRecorde(formatVolume(c.ml))
    case 'streak':
      return STRINGS.celebracoes.diasSeguidos(c.days)
    case 'lead':
      return STRINGS.celebracoes.lideranca
    case 'litre':
      return STRINGS.celebracoes.litrosHoje(c.litres)
  }
}
