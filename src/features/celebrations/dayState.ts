import { unlockedFish } from '@/features/fish/unlocks'
import type { DayKey } from '@/lib/dates'
import { dayTotals, totalsForDay, type RankableEntry } from '@/lib/rankings'
import { streakOf } from '@/lib/streaks'
import { monthsWon } from '@/lib/wrapup'
import type { DayState } from './engine'

/** Snapshot of "your day" from the mirror — computed before and after a register (spec §7). */
export function dayStateOf(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  userId: string,
  today: DayKey,
): DayState {
  const todays = totalsForDay(entries, today)
  const mine = todays.get(userId) ?? 0
  const partnerBest = Math.max(0, ...memberIds.filter((id) => id !== userId).map((id) => todays.get(id) ?? 0))
  const byDay = dayTotals(entries, userId)
  let bestOtherDayMl = 0
  for (const [day, ml] of byDay) {
    if (day !== today && ml > bestOtherDayMl) bestOtherDayMl = ml
  }
  return {
    todayMl: mine,
    bestOtherDayMl,
    leading: partnerBest > 0 && mine > partnerBest,
    streakDays: streakOf(new Set(byDay.keys()), today).days,
    unlocked: unlockedFish(entries, userId, monthsWon(entries, memberIds, userId, today)),
  }
}
