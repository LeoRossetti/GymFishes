import { describe, expect, it } from 'vitest'
import { addDays, dayKey } from '@/lib/dates'
import type { Unlock } from './catalog'
import { regularUserFacts, regularUserMl } from './regularUser.fixture'
import { availableFish, meets, unlockFacts, unlockProgress, unlockedFish, type UnlockEntry } from './unlocks'

const STARTERS = ['guppy', 'betta', 'goldfish', 'neon']

const e = (
  profile_id: string,
  total_ml: number,
  drank_on: string,
  extra: Partial<Pick<UnlockEntry, 'deleted_at' | 'drank_at' | 'note' | 'composition'>> = {},
): UnlockEntry => ({ profile_id, total_ml, drank_on, deleted_at: null, ...extra })

/** `n` consecutive 500 ml days for member `a`, starting at `from`. */
const run = (n: number, from = '2026-06-01') => Array.from({ length: n }, (_, i) => e('a', 500, addDays(from, i)))

/** A register of member `a` at a UTC instant; `drank_on` is its São Paulo day, as the database trigger sets it. */
const at = (drank_at: string, total_ml = 500): UnlockEntry => e('a', total_ml, dayKey(new Date(drank_at)), { drank_at })

/** One register at `time` (UTC) on each of `n` days from June 1. */
const daily = (n: number, time: string, ml = 500) =>
  Array.from({ length: n }, (_, i) => at(`${addDays('2026-06-01', i)}T${time}Z`, ml))

describe('availableFish', () => {
  it('is the earned set now that the gate is on: only the starters with no registers', () => {
    expect([...availableFish([], 'a')]).toEqual(STARTERS)
  })
})

describe('unlockedFish', () => {
  it('always includes the four starters, even with no registers', () => {
    expect([...unlockedFish([], 'a')]).toEqual(STARTERS)
  })

  it('unlocks the pufferfish with the first register that used a bottle', () => {
    const loose = e('a', 500, '2026-06-01', { composition: [{ kind: 'loose', amount_ml: 500 }] })
    const bottle = e('a', 500, '2026-06-01', { composition: [{ kind: 'bottle', name: 'Azul', volume_ml: 500, qty: 1 }] })
    expect(unlockedFish([loose], 'a').has('pufferfish')).toBe(false)
    expect(unlockedFish([bottle], 'a').has('pufferfish')).toBe(true)
  })

  it('unlocks the clownfish with a register that carries a note', () => {
    expect(unlockedFish([e('a', 500, '2026-06-01', { note: '   ' })], 'a').has('clownfish')).toBe(false)
    expect(unlockedFish([e('a', 500, '2026-06-01', { note: 'pós-treino' })], 'a').has('clownfish')).toBe(true)
  })

  it('unlocks the octopus with a register before 9h in Sao Paulo', () => {
    // 12:00Z is 9:00 in Sao Paulo — not before 9h; 11:59Z is 8:59
    expect(unlockedFish([e('a', 500, '2026-06-01', { drank_at: '2026-06-01T12:00:00Z' })], 'a').has('octopus')).toBe(false)
    expect(unlockedFish([e('a', 500, '2026-06-01', { drank_at: '2026-06-01T11:59:00Z' })], 'a').has('octopus')).toBe(true)
  })

  it('unlocks the streak fish at exactly 3, 7 and 14 consecutive days', () => {
    expect(unlockedFish(run(2), 'a').has('seahorse')).toBe(false)
    expect(unlockedFish(run(3), 'a').has('seahorse')).toBe(true)
    expect(unlockedFish(run(6), 'a').has('tambaqui')).toBe(false)
    expect(unlockedFish(run(7), 'a').has('tambaqui')).toBe(true)
    expect(unlockedFish(run(13), 'a').has('dolphin')).toBe(false)
    expect(unlockedFish(run(14), 'a').has('dolphin')).toBe(true)
  })

  it('keeps a streak fish after the streak breaks — the longest run ever counts', () => {
    expect(unlockedFish([...run(3), e('a', 500, '2026-06-20')], 'a').has('seahorse')).toBe(true)
  })

  it('needs one day of at least 3 L for the turtle', () => {
    expect(unlockedFish([e('a', 1500, '2026-06-01'), e('a', 1499, '2026-06-01')], 'a').has('turtle')).toBe(false)
    expect(unlockedFish([e('a', 1500, '2026-06-01'), e('a', 1500, '2026-06-01')], 'a').has('turtle')).toBe(true)
  })

  it('unlocks the shark at 50 registers, whatever their size', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => e('a', 100, addDays('2026-06-01', i % 5)))
    expect(unlockedFish(many(49), 'a').has('shark')).toBe(false)
    expect(unlockedFish(many(50), 'a').has('shark')).toBe(true)
  })

  it('unlocks the whale at 60 L accumulated', () => {
    const litres = (l: number) => Array.from({ length: l }, (_, i) => e('a', 1000, addDays('2026-06-01', i)))
    expect(unlockedFish(litres(59), 'a').has('whale')).toBe(false)
    expect(unlockedFish(litres(60), 'a').has('whale')).toBe(true)
  })

  it('ignores deleted rows and other members', () => {
    const noise = [
      ...run(3).map((r) => ({ ...r, deleted_at: '2026-06-09T00:00:00Z' })),
      ...run(3).map((r) => ({ ...r, profile_id: 'b' })),
      e('a', 500, '2026-06-01', { deleted_at: '2026-06-09T00:00:00Z', note: 'x', composition: [{ kind: 'bottle' }] }),
    ]
    const set = unlockedFish(noise, 'a')
    expect(set.has('seahorse')).toBe(false)
    expect(set.has('pufferfish')).toBe(false)
    expect(set.has('clownfish')).toBe(false)
  })
})

describe('unlockFacts', () => {
  it('reports the all-time facts the achievements look at', () => {
    const facts = unlockFacts(
      [
        ...run(3),
        e('a', 4000, '2026-06-02', { note: 'treino', drank_at: '2026-06-02T10:30:00Z' }),
        e('a', 100, '2026-05-01', { composition: [{ kind: 'bottle', name: 'Azul', volume_ml: 100, qty: 1 }] }),
      ],
      'a',
      '2026-06-03',
    )
    expect(facts).toEqual({
      longestStreak: 3,
      currentStreak: 3,
      registeredDays: 4,
      dayTotalsMl: [500, 4500, 500, 100],
      firstHours: [7],
      bestDayMl: 4500,
      totalMl: 5600,
      registers: 5,
      usedBottle: true,
      wroteNote: true,
      earliestHour: 7,
    })
  })

  it('is empty with no registers', () => {
    expect(unlockFacts([], 'a')).toEqual({
      longestStreak: 0,
      currentStreak: 0,
      registeredDays: 0,
      dayTotalsMl: [],
      firstHours: [],
      bestDayMl: 0,
      totalMl: 0,
      registers: 0,
      usedBottle: false,
      wroteNote: false,
      earliestHour: 24,
    })
  })
})

describe('the counted achievements', () => {
  const MORNINGS: Unlock = { kind: 'mornings', before: 9, days: 5 }
  const GOAL_DAYS: Unlock = { kind: 'goalDays', ml: 2000, days: 10 }
  const DAYS: Unlock = { kind: 'days', days: 60 }
  const morning = (n: number) => daily(n, '11:59:00') // 08:59 in São Paulo

  it('mornings: five different days with a register before 9h in São Paulo', () => {
    expect(meets(MORNINGS, unlockFacts(morning(4), 'a'))).toBe(false)
    expect(meets(MORNINGS, unlockFacts(morning(5), 'a'))).toBe(true)
    expect(meets(MORNINGS, unlockFacts([...morning(4), ...morning(4)], 'a'))).toBe(false)
  })

  it('mornings: 09:00 in São Paulo is not before 9h', () => {
    expect(meets(MORNINGS, unlockFacts([...morning(4), at('2026-06-05T12:00:00Z')], 'a'))).toBe(false)
  })

  it('mornings: 02:30Z is 23:30 of the evening before in São Paulo, so it counts for that day, not as a morning', () => {
    const sameDay = unlockFacts([...morning(4), at('2026-06-05T02:30:00Z')], 'a') // June 4, 23:30
    expect(sameDay.registeredDays).toBe(4)
    expect(sameDay.firstHours).toEqual([8, 8, 8, 8])
    const ownDay = unlockFacts([...morning(4), at('2026-06-06T02:30:00Z')], 'a') // June 5, 23:30
    expect(ownDay.firstHours).toEqual([8, 8, 8, 8, 23])
    expect(meets(MORNINGS, ownDay)).toBe(false)
  })

  it('goalDays: ten days whose totals reach exactly 2 L', () => {
    const goal = (n: number) => [...daily(n, '13:00:00', 1000), ...daily(n, '21:00:00', 1000)]
    expect(meets(GOAL_DAYS, unlockFacts(goal(9), 'a'))).toBe(false)
    expect(meets(GOAL_DAYS, unlockFacts(goal(10), 'a'))).toBe(true)
    const deleted = goal(10).map((r, i) => (i === 0 ? { ...r, deleted_at: '2026-06-02T00:00:00Z' } : r))
    expect(meets(GOAL_DAYS, unlockFacts(deleted, 'a'))).toBe(false)
  })

  it('goalDays: 2 L inside one UTC day but split across two São Paulo days is no goal day', () => {
    const nine = [...daily(9, '13:00:00', 1000), ...daily(9, '21:00:00', 1000)] // June 1–9
    // both on June 11 in UTC; 22:00 of June 10 and noon of June 11 in São Paulo
    const split = [at('2026-06-11T01:00:00Z', 1000), at('2026-06-11T15:00:00Z', 1000)]
    expect(meets(GOAL_DAYS, unlockFacts([...nine, ...split], 'a'))).toBe(false)
  })

  it('days: counts distinct São Paulo days with a live register', () => {
    const noons = daily(59, '15:00:00') // June 1 – July 29
    const twice = [...noons, ...noons]
    const july30 = at('2026-07-30T15:00:00Z')
    expect(meets(DAYS, unlockFacts(twice, 'a'))).toBe(false)
    expect(meets(DAYS, unlockFacts([...twice, at('2026-07-30T02:00:00Z')], 'a'))).toBe(false) // July 29, 23:00
    expect(meets(DAYS, unlockFacts([...twice, { ...july30, deleted_at: '2026-07-31T00:00:00Z' }], 'a'))).toBe(false)
    expect(meets(DAYS, unlockFacts([...twice, july30], 'a'))).toBe(true)
  })

  it('record: a best day of exactly 3,5 L meets', () => {
    const RECORD: Unlock = { kind: 'record', ml: 3500 }
    expect(meets(RECORD, unlockFacts([e('a', 2000, '2026-06-01'), e('a', 1499, '2026-06-01')], 'a'))).toBe(false)
    expect(meets(RECORD, unlockFacts([e('a', 2000, '2026-06-01'), e('a', 1500, '2026-06-01')], 'a'))).toBe(true)
  })
})

describe('unlockProgress', () => {
  const TODAY = '2026-07-31'
  const STREAK_30: Unlock = { kind: 'streak', days: 30 }

  it('counts the current run toward a streak fish, not the longest ever', () => {
    const facts = unlockFacts([...run(20, '2026-06-01'), ...run(12, '2026-07-20')], 'a', TODAY)
    expect(facts.longestStreak).toBe(20)
    expect(unlockProgress(STREAK_30, facts)).toEqual({ current: 12, target: 30 })
  })

  it('keeps a run that ended yesterday while today is still empty', () => {
    expect(unlockProgress(STREAK_30, unlockFacts(run(5, '2026-07-26'), 'a', TODAY))).toEqual({ current: 5, target: 30 })
  })

  it('reports volumes in ml', () => {
    const litres = unlockFacts(Array.from({ length: 84 }, (_, i) => e('a', 1000, addDays('2026-05-01', i))), 'a', TODAY)
    expect(unlockProgress({ kind: 'volume', ml: 250_000 }, litres)).toEqual({ current: 84_000, target: 250_000 })
  })

  it('reads each counted kind off the facts', () => {
    // 08:00, 10:00 and 07:00 in São Paulo
    const days = [at('2026-06-01T11:00:00Z', 2000), at('2026-06-02T13:00:00Z', 1500), at('2026-06-03T10:00:00Z', 2500)]
    const facts = unlockFacts(days, 'a', TODAY)
    expect(unlockProgress({ kind: 'mornings', before: 9, days: 5 }, facts)).toEqual({ current: 2, target: 5 })
    expect(unlockProgress({ kind: 'goalDays', ml: 2000, days: 10 }, facts)).toEqual({ current: 2, target: 10 })
    expect(unlockProgress({ kind: 'days', days: 60 }, facts)).toEqual({ current: 3, target: 60 })
    expect(unlockProgress({ kind: 'record', ml: 3500 }, facts)).toEqual({ current: 2500, target: 3500 })
    expect(unlockProgress({ kind: 'count', registers: 100 }, facts)).toEqual({ current: 3, target: 100 })
  })

  it('never passes the target', () => {
    const facts = unlockFacts(run(40), 'a', TODAY)
    expect(unlockProgress({ kind: 'count', registers: 30 }, facts)).toEqual({ current: 30, target: 30 })
    expect(unlockProgress({ kind: 'record', ml: 400 }, facts)).toEqual({ current: 400, target: 400 })
  })

  it('shows no progress for the starters and the one-off kinds', () => {
    const facts = unlockFacts(run(3), 'a', TODAY)
    expect(unlockProgress({ kind: 'starter' }, facts)).toBeNull()
    expect(unlockProgress({ kind: 'bottle' }, facts)).toBeNull()
    expect(unlockProgress({ kind: 'note' }, facts)).toBeNull()
    expect(unlockProgress({ kind: 'morning', before: 9 }, facts)).toBeNull()
  })
})

describe('the regular user (pacing fixture)', () => {
  /** Days 1…n with registers, by the fixture's rules. */
  const registered = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => regularUserMl(d) > 0)
  const mornings = (hours: readonly number[]) => hours.filter((h) => h < 9).length
  const goalDays = (totals: readonly number[]) => totals.filter((ml) => ml >= 2000).length

  it('drinks a seeded 1,8–2,6 L on every registered day but day 38, which is 3,6 L', () => {
    for (const d of registered(150)) {
      if (d === 38) continue
      expect(regularUserMl(d)).toBeGreaterThanOrEqual(1800)
      expect(regularUserMl(d)).toBeLessThanOrEqual(2600)
    }
    expect(regularUserMl(38)).toBe(3600)
  })

  it('on day 1: one day of four registers, the first at 10:00', () => {
    const f = regularUserFacts(1, 'a')
    expect(f.registeredDays).toBe(1)
    expect(f.longestStreak).toBe(1)
    expect(mornings(f.firstHours)).toBe(0)
    expect(goalDays(f.dayTotalsMl)).toBe(regularUserMl(1) >= 2000 ? 1 : 0)
    expect(f.registers).toBe(4)
    expect(f.totalMl).toBe(regularUserMl(1))
  })

  it('on day 140: eleven rest days so far (10, 20, 30, 40, 80 … 140) and the 39-day run of days 41–79', () => {
    const f = regularUserFacts(140, 'a')
    const days = registered(140)
    expect(days).toHaveLength(129)
    expect(f.registeredDays).toBe(129)
    expect(f.longestStreak).toBe(39)
    expect(f.currentStreak).toBe(9) // days 131–139; day 140 is a rest day
    expect(mornings(f.firstHours)).toBe(59) // the 70 even days but the eleven rest days, all even
    expect(goalDays(f.dayTotalsMl)).toBe(days.filter((d) => regularUserMl(d) >= 2000).length)
    expect(f.registers).toBe(4 * 129)
    expect(f.totalMl).toBe(days.reduce((sum, d) => sum + regularUserMl(d), 0))
    expect(f.bestDayMl).toBe(3600)
  })
})
