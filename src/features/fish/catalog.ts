import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/**
 * M10 spec §3 table order: the four starters, then the fourteen achievements from the quickest to
 * the slowest to earn, which is also the animals' real size, the whale last. It is the gallery order
 * and the priority among fish unlocked by the same register.
 */
export const FISH_IDS = [
  'guppy',
  'betta',
  'goldfish',
  'neon',
  'clownfish',
  'pufferfish',
  'tucunare',
  'tambaqui',
  'dourado',
  'barracuda',
  'mahimahi',
  'grouper',
  'pintado',
  'pirarucu',
  'tuna',
  'swordfish',
  'shark',
  'whale',
] as const

export type FishId = (typeof FISH_IDS)[number]

/** An achievement: every kind is an all-time fact of your own registers, so a fish never re-locks. */
export type Unlock =
  | { kind: 'starter' }
  | { kind: 'streak'; days: number }
  | { kind: 'mornings'; before: number; days: number }
  | { kind: 'goalDays'; ml: number; days: number }
  | { kind: 'days'; days: number }
  | { kind: 'record'; ml: number }
  | { kind: 'count'; registers: number }
  | { kind: 'volume'; ml: number }

/** The ladder (M10 spec §3): nothing before day 3, and a regular user lands the whale around month four. */
export const UNLOCKS: Record<FishId, Unlock> = {
  guppy: { kind: 'starter' },
  betta: { kind: 'starter' },
  goldfish: { kind: 'starter' },
  neon: { kind: 'starter' },
  clownfish: { kind: 'streak', days: 3 },
  pufferfish: { kind: 'mornings', before: 9, days: 5 },
  tucunare: { kind: 'streak', days: 7 },
  tambaqui: { kind: 'goalDays', ml: 2000, days: 10 },
  dourado: { kind: 'count', registers: 100 },
  barracuda: { kind: 'streak', days: 14 },
  mahimahi: { kind: 'record', ml: 3500 },
  grouper: { kind: 'volume', ml: 100_000 },
  pintado: { kind: 'days', days: 60 },
  pirarucu: { kind: 'streak', days: 30 },
  tuna: { kind: 'goalDays', ml: 2000, days: 45 },
  swordfish: { kind: 'count', registers: 400 },
  shark: { kind: 'volume', ml: 200_000 },
  whale: { kind: 'days', days: 120 },
}

/** Where the fish lives: it turns the member's tube water river green or reef blue as the day fills. */
export type Habitat = 'fresh' | 'salt'

export const HABITAT: Record<FishId, Habitat> = {
  guppy: 'fresh',
  betta: 'fresh',
  goldfish: 'fresh',
  neon: 'fresh',
  clownfish: 'salt',
  pufferfish: 'salt',
  tucunare: 'fresh',
  tambaqui: 'fresh',
  dourado: 'fresh',
  barracuda: 'salt',
  mahimahi: 'salt',
  grouper: 'salt',
  pintado: 'fresh',
  pirarucu: 'fresh',
  tuna: 'salt',
  swordfish: 'salt',
  shark: 'salt',
  whale: 'salt',
}

export function habitatOf(id: FishId): Habitat {
  return HABITAT[id]
}

export const STARTERS: readonly FishId[] = FISH_IDS.filter((id) => UNLOCKS[id].kind === 'starter')

/**
 * The gate. `true` offered every fish (thirteen then) from 2026-09-24 until the achievements arrived
 * the same day; it stays as the one-line switch should Leo ever want every fish open again.
 */
export const ALL_FISH_AVAILABLE = false

/** 3, 7, 14, 30 — read off the catalog so the streak celebration and the streak fish can never disagree. */
export const STREAK_MILESTONES: readonly number[] = FISH_IDS.flatMap((id) => {
  const u = UNLOCKS[id]
  return u.kind === 'streak' ? [u.days] : []
})

/** The four fish M10 dropped, each shown as the fish that took its place (M10 spec §3). */
const REPLACED = new Map<string, FishId>([
  ['seahorse', 'barracuda'],
  ['octopus', 'swordfish'],
  ['turtle', 'mahimahi'],
  ['dolphin', 'grouper'],
])

/**
 * `profiles.fish_variant` is free text in the DB: a dropped fish becomes its replacement, anything
 * else we don't draw the default guppy.
 */
export function fishOf(value: string): FishId {
  if ((FISH_IDS as readonly string[]).includes(value)) return value as FishId
  return REPLACED.get(value) ?? 'guppy'
}

export function fishName(id: FishId): string {
  return STRINGS.peixes.nomes[id]
}

/** The achievement's name: under a locked fish in the gallery (spec §5.5) and on the unlock screen (§7). */
export function unlockLabel(u: Unlock): string {
  switch (u.kind) {
    case 'starter':
      return STRINGS.peixes.inicial
    case 'streak':
      return STRINGS.peixes.sequenciaDias(u.days)
    case 'mornings':
      return STRINGS.peixes.antesDasEmDias(u.before, u.days)
    case 'goalDays':
      return STRINGS.peixes.diasCom(u.days, formatVolume(u.ml))
    case 'days':
      return STRINGS.peixes.diasComRegistro(u.days)
    case 'record':
      return STRINGS.peixes.umDiaCom(formatVolume(u.ml))
    case 'count':
      return STRINGS.peixes.registros(u.registers)
    case 'volume':
      return STRINGS.peixes.acumulados(formatVolume(u.ml))
  }
}
