import type { DayKey } from './dates'
import { containsDay, daysElapsed, type Period } from './periods'
import { totalsByDay, type RankableEntry } from './rankings'

export type MemberStats = {
  totalMl: number
  /** Total over days *elapsed*, not days registered — skipping a day costs you (spec §5.3). */
  averageMl: number
  bestDay: { day: DayKey; ml: number } | null
  daysRegistered: number
  daysElapsed: number
  registers: number
}

/** The "Médias e recordes" column for one member in one period. */
export function statsFor(
  entries: readonly RankableEntry[],
  p: Period,
  today: DayKey,
  profileId: string,
): MemberStats {
  const byDay = totalsByDay(entries, p, profileId)
  let totalMl = 0
  let bestDay: MemberStats['bestDay'] = null
  for (const [day, ml] of byDay) {
    totalMl += ml
    if (!bestDay || ml > bestDay.ml || (ml === bestDay.ml && day < bestDay.day)) bestDay = { day, ml }
  }
  const elapsed = daysElapsed(p, today)
  const registers = entries.filter(
    (e) => !e.deleted_at && e.profile_id === profileId && containsDay(p, e.drank_on),
  ).length
  return {
    totalMl,
    averageMl: elapsed > 0 ? Math.round(totalMl / elapsed) : 0,
    bestDay,
    daysRegistered: byDay.size,
    daysElapsed: elapsed,
    registers,
  }
}
