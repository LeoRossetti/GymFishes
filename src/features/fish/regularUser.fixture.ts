import { addDays, fromDatetimeLocal, pad2, type DayKey } from '@/lib/dates'
import { unlockFacts, type UnlockEntry, type UnlockFacts } from './unlocks'

/**
 * The "regular user" of the pacing table (M10 spec §5.1, §9), a synthetic history for the pacing tests.
 * Day 1 is `REGULAR_USER_START`; the history is the same on every run, so tests can derive their numbers
 * from these rules:
 * - every tenth day (10, 20, 30 …) has no register, except none between days 41 and 75 (so days 41–79
 *   are one 39-day run);
 * - a registered day has four registers totalling a seeded 1800–2600 ml, and day 38 is one 3600 ml day;
 * - the first register is at 08:00 São Paulo on even days and 10:00 on odd days, the others at 12:00,
 *   16:00 and 20:00.
 */
export const REGULAR_USER_START: DayKey = '2026-03-02'

const SEED = 2026
const LATER_HOURS = [12, 16, 20] as const

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
  if (n % 10 === 0 && (n < 41 || n > 75)) return 0
  if (n === 38) return 3600
  return 1800 + Math.round(seeded(n) * 80) * 10
}

/** The registers of days 1…`days`, as member `profileId`. */
export function regularUser(days: number, profileId: string): UnlockEntry[] {
  const out: UnlockEntry[] = []
  for (let n = 1; n <= days; n++) {
    const ml = regularUserMl(n)
    if (ml === 0) continue
    const day = regularUserDay(n)
    const quarter = Math.floor(ml / 4)
    const hours = [n % 2 === 0 ? 8 : 10, ...LATER_HOURS]
    hours.forEach((hour, i) =>
      out.push({
        profile_id: profileId,
        total_ml: i === hours.length - 1 ? ml - 3 * quarter : quarter,
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
