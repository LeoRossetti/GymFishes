import { hourOf } from '@/lib/dates'
import { dayTotals, type RankableEntry } from '@/lib/rankings'
import { longestStreak } from '@/lib/streaks'
import { ALL_FISH_AVAILABLE, FISH_IDS, UNLOCKS, type FishId, type Unlock } from './catalog'

/** A register as the achievements read it; the extra fields are optional so ranking fixtures still fit. */
export type UnlockEntry = RankableEntry & {
  drank_at?: string
  note?: string | null
  composition?: unknown
}

export type UnlockFacts = {
  longestStreak: number
  bestDayMl: number
  totalMl: number
  registers: number
  usedBottle: boolean
  wroteNote: boolean
  /** The earliest wall-clock hour you ever registered at; 24 with no registers. */
  earliestHour: number
}

function usesBottle(composition: unknown): boolean {
  return (
    Array.isArray(composition) &&
    composition.some((i: unknown) => typeof i === 'object' && i !== null && (i as { kind?: unknown }).kind === 'bottle')
  )
}

/** Everything the nine achievements look at, from one member's live registers. All-time on purpose. */
export function unlockFacts(entries: readonly UnlockEntry[], profileId: string): UnlockFacts {
  const byDay = dayTotals(entries, profileId)
  let totalMl = 0
  let bestDayMl = 0
  for (const ml of byDay.values()) {
    totalMl += ml
    if (ml > bestDayMl) bestDayMl = ml
  }
  let registers = 0
  let usedBottle = false
  let wroteNote = false
  let earliestHour = 24
  for (const e of entries) {
    if (e.profile_id !== profileId || e.deleted_at) continue
    registers++
    if (usesBottle(e.composition)) usedBottle = true
    if (e.note && e.note.trim() !== '') wroteNote = true
    if (e.drank_at) earliestHour = Math.min(earliestHour, hourOf(new Date(e.drank_at)))
  }
  return { longestStreak: longestStreak(new Set(byDay.keys())), bestDayMl, totalMl, registers, usedBottle, wroteNote, earliestHour }
}

export function meets(u: Unlock, f: UnlockFacts): boolean {
  switch (u.kind) {
    case 'starter':
      return true
    case 'bottle':
      return f.usedBottle
    case 'note':
      return f.wroteNote
    case 'morning':
      return f.earliestHour < u.before
    case 'streak':
      return f.longestStreak >= u.days
    case 'record':
      return f.bestDayMl > u.ml
    case 'count':
      return f.registers >= u.registers
    case 'volume':
      return f.totalMl >= u.ml
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

/** What the gallery and the celebrations use: all thirteen while `ALL_FISH_AVAILABLE`, else the earned set. */
export function availableFish(entries: readonly UnlockEntry[], profileId: string): Set<FishId> {
  return ALL_FISH_AVAILABLE ? new Set(FISH_IDS) : unlockedFish(entries, profileId)
}
