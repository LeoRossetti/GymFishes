import type { DayKey } from './dates'

export type RankableEntry = {
  profile_id: string
  total_ml: number
  drank_on: string
  deleted_at: string | null
}

/** Volume per member for one calendar day. Soft-deleted rows are ignored. */
export function totalsForDay(
  entries: readonly RankableEntry[],
  day: DayKey,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const e of entries) {
    if (e.deleted_at || e.drank_on !== day) continue
    totals.set(e.profile_id, (totals.get(e.profile_id) ?? 0) + e.total_ml)
  }
  return totals
}
