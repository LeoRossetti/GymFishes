import { dayTotals, type RankableEntry } from '@/lib/rankings'
import { longestStreak } from '@/lib/streaks'
import { FISH_IDS, UNLOCKS, type FishId, type Unlock } from './catalog'

export type UnlockFacts = {
  longestStreak: number
  bestDayMl: number
  totalMl: number
  monthsWon: number
}

/** Everything the thirteen conditions look at, from one member's registers. All-time on purpose. */
export function unlockFacts(entries: readonly RankableEntry[], profileId: string, monthsWon: number): UnlockFacts {
  const byDay = dayTotals(entries, profileId)
  let totalMl = 0
  let bestDayMl = 0
  for (const ml of byDay.values()) {
    totalMl += ml
    if (ml > bestDayMl) bestDayMl = ml
  }
  return { longestStreak: longestStreak(new Set(byDay.keys())), bestDayMl, totalMl, monthsWon }
}

export function meets(u: Unlock, f: UnlockFacts): boolean {
  switch (u.kind) {
    case 'starter':
      return true
    case 'streak':
      return f.longestStreak >= u.days
    case 'record':
      return f.bestDayMl > u.ml
    case 'volume':
      return f.totalMl >= u.ml
    case 'wins':
      return f.monthsWon >= u.months
  }
}

/**
 * Derived, never stored (spec §6). Every fact is all-time, so the set only ever grows — a
 * broken streak keeps its fish. `monthsWon` comes from `lib/wrapup.ts`.
 */
export function unlockedFish(entries: readonly RankableEntry[], profileId: string, monthsWon: number): Set<FishId> {
  const facts = unlockFacts(entries, profileId, monthsWon)
  return new Set(FISH_IDS.filter((id) => meets(UNLOCKS[id], facts)))
}
