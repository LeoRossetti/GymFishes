import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/**
 * Spec §6 table order: the four starters, then the nine achievements from the quickest to the
 * slowest to earn — also the priority among fish unlocked by the same register. The tambaqui sits
 * in the middle of the ladder (Leo, 2026-09-24).
 */
export const FISH_IDS = [
  'guppy',
  'betta',
  'goldfish',
  'neon',
  'pufferfish',
  'clownfish',
  'octopus',
  'seahorse',
  'tambaqui',
  'turtle',
  'dolphin',
  'shark',
  'whale',
] as const

export type FishId = (typeof FISH_IDS)[number]

/** An achievement: every kind is an all-time fact of your own registers, so a fish never re-locks. */
export type Unlock =
  | { kind: 'starter' }
  | { kind: 'bottle' }
  | { kind: 'note' }
  | { kind: 'morning'; before: number }
  | { kind: 'streak'; days: number }
  | { kind: 'record'; ml: number }
  | { kind: 'count'; registers: number }
  | { kind: 'volume'; ml: number }

/** The ladder (spec §6): a regular user completes it in about a month; nothing waits for a month to end. */
export const UNLOCKS: Record<FishId, Unlock> = {
  guppy: { kind: 'starter' },
  betta: { kind: 'starter' },
  goldfish: { kind: 'starter' },
  neon: { kind: 'starter' },
  pufferfish: { kind: 'bottle' },
  clownfish: { kind: 'note' },
  octopus: { kind: 'morning', before: 9 },
  seahorse: { kind: 'streak', days: 3 },
  tambaqui: { kind: 'streak', days: 7 },
  turtle: { kind: 'record', ml: 3000 },
  dolphin: { kind: 'streak', days: 14 },
  shark: { kind: 'count', registers: 50 },
  whale: { kind: 'volume', ml: 60_000 },
}

export const STARTERS: readonly FishId[] = FISH_IDS.filter((id) => UNLOCKS[id].kind === 'starter')

/**
 * The gate. `true` offered all thirteen from 2026-09-24 until the achievements above arrived the same
 * day; it stays as the one-line switch should Leo ever want every fish open again.
 */
export const ALL_FISH_AVAILABLE = false

/** 3, 7, 14 — read off the catalog so the streak celebration and the streak fish can never disagree. */
export const STREAK_MILESTONES: readonly number[] = FISH_IDS.flatMap((id) => {
  const u = UNLOCKS[id]
  return u.kind === 'streak' ? [u.days] : []
})

/** `profiles.fish_variant` is free text in the DB; anything we don't draw becomes the default guppy. */
export function fishOf(value: string): FishId {
  return (FISH_IDS as readonly string[]).includes(value) ? (value as FishId) : 'guppy'
}

export function fishName(id: FishId): string {
  return STRINGS.peixes.nomes[id]
}

/** The achievement's name: under a locked fish in the gallery (spec §5.5) and on the unlock screen (§7). */
export function unlockLabel(u: Unlock): string {
  switch (u.kind) {
    case 'starter':
      return STRINGS.peixes.inicial
    case 'bottle':
      return STRINGS.peixes.registreComGarrafa
    case 'note':
      return STRINGS.peixes.registreComNota
    case 'morning':
      return STRINGS.peixes.registreAntesDas(u.before)
    case 'streak':
      return STRINGS.peixes.sequenciaDias(u.days)
    case 'record':
      return STRINGS.peixes.umDiaAcimaDe(formatVolume(u.ml))
    case 'count':
      return STRINGS.peixes.registros(u.registers)
    case 'volume':
      return STRINGS.peixes.acumulados(formatVolume(u.ml))
  }
}
