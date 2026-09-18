import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/** Spec §6 table order — also the priority among fish unlocked by the same register. */
export const FISH_IDS = [
  'guppy',
  'betta',
  'goldfish',
  'neon',
  'pufferfish',
  'clownfish',
  'angelfish',
  'octopus',
  'seahorse',
  'turtle',
  'dolphin',
  'shark',
  'whale',
] as const

export type FishId = (typeof FISH_IDS)[number]

export type Unlock =
  | { kind: 'starter' }
  | { kind: 'streak'; days: number }
  | { kind: 'record'; ml: number }
  | { kind: 'volume'; ml: number }
  | { kind: 'wins'; months: number }

export const UNLOCKS: Record<FishId, Unlock> = {
  guppy: { kind: 'starter' },
  betta: { kind: 'starter' },
  goldfish: { kind: 'starter' },
  neon: { kind: 'starter' },
  pufferfish: { kind: 'streak', days: 7 },
  clownfish: { kind: 'streak', days: 30 },
  angelfish: { kind: 'streak', days: 100 },
  octopus: { kind: 'record', ml: 5000 },
  seahorse: { kind: 'volume', ml: 100_000 },
  turtle: { kind: 'volume', ml: 500_000 },
  dolphin: { kind: 'volume', ml: 1_000_000 },
  shark: { kind: 'wins', months: 1 },
  whale: { kind: 'wins', months: 3 },
}

export const STARTERS: readonly FishId[] = FISH_IDS.filter((id) => UNLOCKS[id].kind === 'starter')

/** 7, 30, 100 — read off the catalog so the streak celebration and the streak fish can never disagree. */
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

/** The condition text under a locked fish in the gallery (spec §5.5). */
export function unlockLabel(u: Unlock): string {
  switch (u.kind) {
    case 'starter':
      return STRINGS.peixes.inicial
    case 'streak':
      return STRINGS.peixes.sequenciaDias(u.days)
    case 'record':
      return STRINGS.peixes.umDiaAcimaDe(formatVolume(u.ml))
    case 'volume':
      return STRINGS.peixes.acumulados(formatVolume(u.ml))
    case 'wins':
      return STRINGS.peixes.ganharMeses(u.months)
  }
}
