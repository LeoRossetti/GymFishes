import { dayKey, hourOf, type DayKey } from '@/lib/dates'
import { dayTotals, type RankableEntry } from '@/lib/rankings'
import { longestStreak, streakOf } from '@/lib/streaks'
import { ALL_FISH_AVAILABLE, FISH_IDS, UNLOCKS, type FishId, type Unlock } from './catalog'

/** A register as the achievements read it; `drank_at` is optional so ranking fixtures still fit. */
export type UnlockEntry = RankableEntry & {
  drank_at?: string
}

export type UnlockFacts = {
  longestStreak: number
  /** The run that counts back from today, or from yesterday while today is empty — what the gallery shows. */
  currentStreak: number
  registeredDays: number
  /** One total per registered day. */
  dayTotalsMl: readonly number[]
  /** Per registered day, the earliest São Paulo hour of a register (days with no `drank_at` are absent). */
  firstHours: readonly number[]
  bestDayMl: number
  totalMl: number
  registers: number
}

/**
 * Everything the achievements look at, from one member's live registers. All-time on purpose; only
 * `currentStreak` depends on `today`, and only the gallery's progress reads it.
 */
export function unlockFacts(
  entries: readonly UnlockEntry[],
  profileId: string,
  today: DayKey = dayKey(new Date()),
): UnlockFacts {
  const byDay = dayTotals(entries, profileId)
  const dayTotalsMl = [...byDay.values()]
  let totalMl = 0
  let bestDayMl = 0
  for (const ml of dayTotalsMl) {
    totalMl += ml
    if (ml > bestDayMl) bestDayMl = ml
  }
  let registers = 0
  const firstHour = new Map<DayKey, number>()
  for (const e of entries) {
    if (e.profile_id !== profileId || e.deleted_at) continue
    registers++
    if (e.drank_at) {
      const hour = hourOf(new Date(e.drank_at))
      firstHour.set(e.drank_on, Math.min(firstHour.get(e.drank_on) ?? 24, hour))
    }
  }
  const days = new Set(byDay.keys())
  return {
    longestStreak: longestStreak(days),
    currentStreak: streakOf(days, today).days,
    registeredDays: days.size,
    dayTotalsMl,
    firstHours: [...firstHour.values()],
    bestDayMl,
    totalMl,
    registers,
  }
}

function morningDays(f: UnlockFacts, before: number): number {
  return f.firstHours.filter((hour) => hour < before).length
}

function goalDays(f: UnlockFacts, ml: number): number {
  return f.dayTotalsMl.filter((total) => total >= ml).length
}

export function meets(u: Unlock, f: UnlockFacts): boolean {
  switch (u.kind) {
    case 'starter':
      return true
    case 'streak':
      return f.longestStreak >= u.days
    case 'mornings':
      return morningDays(f, u.before) >= u.days
    case 'goalDays':
      return goalDays(f, u.ml) >= u.days
    case 'days':
      return f.registeredDays >= u.days
    case 'record':
      return f.bestDayMl >= u.ml
    case 'count':
      return f.registers >= u.registers
    case 'volume':
      return f.totalMl >= u.ml
  }
}

/** How far a locked fish is, for the gallery (spec §5.2). Volumes stay in ml; the UI formats them. */
export type Progress = { current: number; target: number }

const progress = (current: number, target: number): Progress => ({ current: Math.min(current, target), target })

/**
 * `null` for a starter, which has nothing to count. A streak fish counts the current run, the days
 * still needed in a row, while `meets` reads the longest run ever, so an earned fish never re-locks.
 */
export function unlockProgress(u: Unlock, f: UnlockFacts): Progress | null {
  switch (u.kind) {
    case 'starter':
      return null
    case 'streak':
      return progress(f.currentStreak, u.days)
    case 'mornings':
      return progress(morningDays(f, u.before), u.days)
    case 'goalDays':
      return progress(goalDays(f, u.ml), u.days)
    case 'days':
      return progress(f.registeredDays, u.days)
    case 'record':
      return progress(f.bestDayMl, u.ml)
    case 'count':
      return progress(f.registers, u.registers)
    case 'volume':
      return progress(f.totalMl, u.ml)
  }
}

/**
 * Derived, never stored (spec §6). Every fact is all-time, so the set only ever grows — a
 * broken streak keeps its fish.
 */
export function unlockedFish(entries: readonly UnlockEntry[], profileId: string): Set<FishId> {
  const facts = unlockFacts(entries, profileId)
  return new Set(FISH_IDS.filter((id) => meets(UNLOCKS[id], facts)))
}

/** What the gallery and the celebrations use: every fish while `ALL_FISH_AVAILABLE`, else the earned set. */
export function availableFish(entries: readonly UnlockEntry[], profileId: string): Set<FishId> {
  return ALL_FISH_AVAILABLE ? new Set(FISH_IDS) : unlockedFish(entries, profileId)
}
