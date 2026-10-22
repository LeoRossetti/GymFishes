import { describe, expect, it } from 'vitest'
import { addDays, dayKey } from '@/lib/dates'
import { FISH_IDS, type Unlock } from './catalog'
import { regularUser, regularUserFacts, regularUserMl } from './regularUser.fixture'
import { availableFish, meets, unlockFacts, unlockProgress, unlockedFish, type UnlockEntry } from './unlocks'

const STARTERS = ['guppy', 'betta', 'goldfish', 'neon']

const e = (
  profile_id: string,
  total_ml: number,
  drank_on: string,
  extra: Partial<Pick<UnlockEntry, 'deleted_at' | 'drank_at'>> = {},
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

  it('unlocks the streak fish at exactly 3, 7, 14 and 30 consecutive days', () => {
    expect(unlockedFish(run(2), 'a').has('clownfish')).toBe(false)
    expect(unlockedFish(run(3), 'a').has('clownfish')).toBe(true)
    expect(unlockedFish(run(6), 'a').has('tucunare')).toBe(false)
    expect(unlockedFish(run(7), 'a').has('tucunare')).toBe(true)
    expect(unlockedFish(run(13), 'a').has('barracuda')).toBe(false)
    expect(unlockedFish(run(14), 'a').has('barracuda')).toBe(true)
    expect(unlockedFish(run(29), 'a').has('pirarucu')).toBe(false)
    expect(unlockedFish(run(30), 'a').has('pirarucu')).toBe(true)
  })

  it('keeps a streak fish after the streak breaks — the longest run ever counts', () => {
    expect(unlockedFish([...run(3), e('a', 500, '2026-06-20')], 'a').has('clownfish')).toBe(true)
  })

  it('unlocks the pufferfish on the fifth day with a register before 9h in São Paulo', () => {
    const mornings = (n: number) => daily(n, '11:59:00') // 08:59 in São Paulo
    expect(unlockedFish(mornings(4), 'a').has('pufferfish')).toBe(false)
    expect(unlockedFish(mornings(5), 'a').has('pufferfish')).toBe(true)
  })

  it('unlocks the tambaqui at ten days of 2 L and the tuna at forty-five', () => {
    const goal = (n: number) => daily(n, '15:00:00', 2000)
    expect(unlockedFish(goal(9), 'a').has('tambaqui')).toBe(false)
    expect(unlockedFish(goal(10), 'a').has('tambaqui')).toBe(true)
    expect(unlockedFish(goal(44), 'a').has('tuna')).toBe(false)
    expect(unlockedFish(goal(45), 'a').has('tuna')).toBe(true)
  })

  it('needs one day of at least 3,5 L for the mahi-mahi', () => {
    expect(unlockedFish([e('a', 2000, '2026-06-01'), e('a', 1499, '2026-06-01')], 'a').has('mahimahi')).toBe(false)
    expect(unlockedFish([e('a', 2000, '2026-06-01'), e('a', 1500, '2026-06-01')], 'a').has('mahimahi')).toBe(true)
  })

  it('unlocks the dourado at 100 registers and the sailfish at 400, whatever their size', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => e('a', 100, addDays('2026-06-01', i % 5)))
    expect(unlockedFish(many(99), 'a').has('dourado')).toBe(false)
    expect(unlockedFish(many(100), 'a').has('dourado')).toBe(true)
    expect(unlockedFish(many(399), 'a').has('sailfish')).toBe(false)
    expect(unlockedFish(many(400), 'a').has('sailfish')).toBe(true)
  })

  it('unlocks the grouper at 100 L accumulated and the shark at 200 L', () => {
    const litres = (l: number) => Array.from({ length: l }, (_, i) => e('a', 1000, addDays('2026-06-01', i)))
    expect(unlockedFish(litres(99), 'a').has('grouper')).toBe(false)
    expect(unlockedFish(litres(100), 'a').has('grouper')).toBe(true)
    expect(unlockedFish(litres(199), 'a').has('shark')).toBe(false)
    expect(unlockedFish(litres(200), 'a').has('shark')).toBe(true)
  })

  it('unlocks the pintado at 60 days with a register and the whale at 120, in a row or not', () => {
    const days = (n: number) => Array.from({ length: n }, (_, i) => e('a', 100, addDays('2026-06-01', 2 * i)))
    expect(unlockedFish(days(59), 'a').has('pintado')).toBe(false)
    expect(unlockedFish(days(60), 'a').has('pintado')).toBe(true)
    expect(unlockedFish(days(119), 'a').has('whale')).toBe(false)
    expect(unlockedFish(days(120), 'a').has('whale')).toBe(true)
  })

  it('ignores deleted rows and other members', () => {
    const noise = [
      ...run(3).map((r) => ({ ...r, deleted_at: '2026-06-09T00:00:00Z' })),
      ...run(3).map((r) => ({ ...r, profile_id: 'b' })),
      e('a', 3500, '2026-06-01', { deleted_at: '2026-06-09T00:00:00Z' }),
    ]
    const set = unlockedFish(noise, 'a')
    expect(set.has('clownfish')).toBe(false)
    expect(set.has('mahimahi')).toBe(false)
  })
})

describe('unlockFacts', () => {
  it('reports the all-time facts the achievements look at', () => {
    const facts = unlockFacts(
      [
        ...run(3),
        e('a', 4000, '2026-06-02', { drank_at: '2026-06-02T10:30:00Z' }),
        e('a', 100, '2026-05-01'),
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

  it('shows no progress for the starters', () => {
    expect(unlockProgress({ kind: 'starter' }, unlockFacts(run(3), 'a', TODAY))).toBeNull()
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

describe('the ladder, for the regular user', () => {
  const earned = (n: number) => unlockedFish(regularUser(n, 'a'), 'a')

  it('gives only the four starters on days 1 and 2', () => {
    expect([...earned(1)]).toEqual(STARTERS)
    expect([...earned(2)]).toEqual(STARTERS)
  })

  it('gives at most three fish besides the starters by day 10', () => {
    expect(earned(10).size - STARTERS.length).toBeLessThanOrEqual(3)
  })

  it('lands the whale after day 99, and every fish by day 150', () => {
    expect(earned(99).has('whale')).toBe(false)
    expect(earned(150)).toEqual(new Set(FISH_IDS))
  })
})
