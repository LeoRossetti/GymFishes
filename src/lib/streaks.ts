import { addDays, type DayKey } from './dates'
import { dayTotals, type RankableEntry } from './rankings'

export type Streak = {
  days: number
  /** Today has no register yet: `days` is yesterday's value and the chip dims (spec §4). */
  atRisk: boolean
}

/** Consecutive registered days counting back from today — or from yesterday while today is empty. */
export function streakOf(days: ReadonlySet<DayKey>, today: DayKey): Streak {
  const atRisk = !days.has(today)
  let cursor = atRisk ? addDays(today, -1) : today
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return { days: n, atRisk: atRisk && n > 0 }
}

/** The longest run ever — what the streak fish are judged on, so a broken streak never re-locks one. */
export function longestStreak(days: ReadonlySet<DayKey>): number {
  let best = 0
  for (const start of days) {
    if (days.has(addDays(start, -1))) continue // not the first day of a run
    let n = 0
    for (let cursor = start; days.has(cursor); cursor = addDays(cursor, 1)) n++
    if (n > best) best = n
  }
  return best
}

/** Days on which `profileId` has at least one live register. */
export function registeredDays(entries: readonly RankableEntry[], profileId: string): Set<DayKey> {
  return new Set(dayTotals(entries, profileId).keys())
}
