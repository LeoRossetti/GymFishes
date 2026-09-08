import type { DayKey } from './dates'
import { containsDay, dayPeriod, type Period } from './periods'

export type RankableEntry = {
  profile_id: string
  total_ml: number
  drank_on: string
  deleted_at: string | null
}

/** One row of the standings. `position` is shared on ties (1, 1, 3); `share` is ml over the leader's ml. */
export type Standing = { profileId: string; ml: number; position: number; share: number }

function live(entries: readonly RankableEntry[], p: Period): RankableEntry[] {
  return entries.filter((e) => !e.deleted_at && containsDay(p, e.drank_on))
}

/** Volume per member inside the period. Soft-deleted rows are ignored. */
export function totalsForPeriod(entries: readonly RankableEntry[], p: Period): Map<string, number> {
  const totals = new Map<string, number>()
  for (const e of live(entries, p)) {
    totals.set(e.profile_id, (totals.get(e.profile_id) ?? 0) + e.total_ml)
  }
  return totals
}

/** Volume per member for one calendar day. */
export function totalsForDay(entries: readonly RankableEntry[], day: DayKey): Map<string, number> {
  return totalsForPeriod(entries, dayPeriod(day))
}

/** One member's volume per day across every live register — the all-time input for streaks and unlocks. */
export function dayTotals(entries: readonly RankableEntry[], profileId: string): Map<DayKey, number> {
  const totals = new Map<DayKey, number>()
  for (const e of entries) {
    if (e.deleted_at || e.profile_id !== profileId) continue
    totals.set(e.drank_on, (totals.get(e.drank_on) ?? 0) + e.total_ml)
  }
  return totals
}

/** One member's volume per day inside the period; days without registers are absent. */
export function totalsByDay(
  entries: readonly RankableEntry[],
  p: Period,
  profileId: string,
): Map<DayKey, number> {
  const totals = new Map<DayKey, number>()
  for (const [day, ml] of dayTotals(entries, profileId)) {
    if (containsDay(p, day)) totals.set(day, ml)
  }
  return totals
}

/** Members ordered by volume, ties sharing a position. Every member appears, at 0 ml if silent. */
export function standings(
  totals: ReadonlyMap<string, number>,
  memberIds: readonly string[],
): Standing[] {
  const rows = memberIds
    .map((id) => ({ profileId: id, ml: totals.get(id) ?? 0 }))
    .sort((a, b) => b.ml - a.ml)
  const leader = rows[0]?.ml ?? 0
  let position = 0
  let prevMl = -1
  return rows.map((r, i) => {
    if (r.ml !== prevMl) {
      position = i + 1
      prevMl = r.ml
    }
    return { ...r, position, share: leader > 0 ? r.ml / leader : 0 }
  })
}

/** Earliest day with a live register — the start of the all-time period (spec §4 "Total"). */
export function firstRegisterDay(entries: readonly RankableEntry[]): DayKey | undefined {
  let first: DayKey | undefined
  for (const e of entries) {
    if (e.deleted_at) continue
    if (first === undefined || e.drank_on < first) first = e.drank_on
  }
  return first
}
