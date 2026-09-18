import type { DayKey } from './dates'
import { monthPeriod, stepPeriod, type Period } from './periods'
import { firstRegisterDay, standings, totalsForPeriod, type RankableEntry, type Standing } from './rankings'

export type Verdict = { rows: Standing[]; winnerId: string | null }

export type WrapUp = { period: Period } & Verdict

/** One month's standings and its winner; null when nobody registered. A tie has no winner. */
export function monthVerdict(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  period: Period,
): Verdict | null {
  const rows = standings(totalsForPeriod(entries, period), memberIds)
  const [first, second] = rows
  if (!first || first.ml === 0) return null
  return { rows, winnerId: second && second.ml === first.ml ? null : first.profileId }
}

/** Last month's result, or null when nobody registered in it (spec §5.3). */
export function monthWrapUp(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  today: DayKey,
): WrapUp | null {
  const period = stepPeriod(monthPeriod(today), -1)
  const verdict = monthVerdict(entries, memberIds, period)
  return verdict ? { period, ...verdict } : null
}

/** Completed months (before today's) that `profileId` won outright — the Tubarão/Baleia counter (spec §6). */
export function monthsWon(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  profileId: string,
  today: DayKey,
): number {
  const first = firstRegisterDay(entries)
  if (!first) return 0
  const current = monthPeriod(today)
  let n = 0
  for (let p = monthPeriod(first); p.start < current.start; p = stepPeriod(p, 1)) {
    if (monthVerdict(entries, memberIds, p)?.winnerId === profileId) n++
  }
  return n
}

/** One key per month, per device — deliberately unsynced (spec §5.3). */
export function wrapUpStorageKey(period: Period): string {
  return `gymfishes:wrapup:${period.start.slice(0, 7)}`
}
