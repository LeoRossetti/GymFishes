import { addDays, fromDatetimeLocal, pad2, type DayKey } from '@/lib/dates'
import { unlockFacts, type UnlockEntry, type UnlockFacts } from './unlocks'

/**
 * The "regular user" of the pacing table (M10 spec §5.1, §9), a synthetic history for the pacing tests.
 * Since 2026-11-13 it is a moderate drinker, not a near-perfect one: the first ladder was tuned to someone
 * who logged nine days in ten at about 2,2 L, and real use fell well short of that.
 * Day 1 is `REGULAR_USER_START`; the history is the same on every run, so tests can derive their numbers
 * from these rules:
 * - every seventh day (7, 14, 21 …) has no register, except days 56 and 63 (so days 50–69 are one
 *   20-day run);
 * - a registered day has three registers totalling a seeded 1200–2200 ml, and day 45 is one 2600 ml day;
 * - the first register is at 09:00 São Paulo on even days and 11:00 on odd days, the others at 14:00
 *   and 19:00.
 */
export const REGULAR_USER_START: DayKey = '2026-03-02'

const SEED = 2026
const LATER_HOURS = [14, 19] as const

/** The n-th output of mulberry32(SEED), in 0…1: a fixed value per day, whatever range is generated. */
function seeded(n: number): number {
  let t = (SEED + Math.imul(n, 0x6d2b79f5)) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
}

/** Day n of the history (day 1 is the start). */
export function regularUserDay(n: number): DayKey {
  return addDays(REGULAR_USER_START, n - 1)
}

/** Day n's total in ml under the rules above; 0 on a register-free day. */
export function regularUserMl(n: number): number {
  if (n % 7 === 0 && n !== 56 && n !== 63) return 0
  if (n === 45) return 2600
  return 1200 + Math.round(seeded(n) * 100) * 10
}

/** The registers of days 1…`days`, as member `profileId`. */
export function regularUser(days: number, profileId: string): UnlockEntry[] {
  const out: UnlockEntry[] = []
  for (let n = 1; n <= days; n++) {
    const ml = regularUserMl(n)
    if (ml === 0) continue
    const day = regularUserDay(n)
    const third = Math.floor(ml / 3)
    const hours = [n % 2 === 0 ? 9 : 11, ...LATER_HOURS]
    hours.forEach((hour, i) =>
      out.push({
        profile_id: profileId,
        total_ml: i === hours.length - 1 ? ml - 2 * third : third,
        drank_on: day,
        drank_at: fromDatetimeLocal(`${day}T${pad2(hour)}:00`).toISOString(),
        deleted_at: null,
      }),
    )
  }
  return out
}

/** The facts at the end of day n, with day n as "today". */
export function regularUserFacts(n: number, profileId: string): UnlockFacts {
  return unlockFacts(regularUser(n, profileId), profileId, regularUserDay(n))
}
