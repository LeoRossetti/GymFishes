import type { DayKey } from './dates'
import { monthPeriod, stepPeriod, type Period } from './periods'
import { standings, totalsForPeriod, type RankableEntry, type Standing } from './rankings'

export type WrapUp = { period: Period; rows: Standing[]; winnerId: string | null }

/** Last month's result, or null when nobody registered in it (spec §5.3). A tie has no winner. */
export function monthWrapUp(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  today: DayKey,
): WrapUp | null {
  const period = stepPeriod(monthPeriod(today), -1)
  const rows = standings(totalsForPeriod(entries, period), memberIds)
  const [first, second] = rows
  if (!first || first.ml === 0) return null
  return { period, rows, winnerId: second && second.ml === first.ml ? null : first.profileId }
}

/** One key per month, per device — deliberately unsynced (spec §5.3). */
export function wrapUpStorageKey(period: Period): string {
  return `gymfishes:wrapup:${period.start.slice(0, 7)}`
}
