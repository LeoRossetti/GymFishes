import { weekdayMon0, type DayKey } from './dates'
import { daysOf, type Period } from './periods'

export type FillStep = 0 | 1 | 2 | 3 | 4

/** Five flat steps for a day's total (spec §5.4): none, <1 L, 1–2 L, 2–3 L, 3 L and up. */
export function fillStep(ml: number): FillStep {
  if (ml <= 0) return 0
  if (ml < 1000) return 1
  if (ml < 2000) return 2
  if (ml < 3000) return 3
  return 4
}

/** A month laid out Monday-first: leading nulls pad the first week, then every day in order. */
export function monthCells(month: Period): (DayKey | null)[] {
  return [...Array<null>(weekdayMon0(month.start)).fill(null), ...daysOf(month)]
}
