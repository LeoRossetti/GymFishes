import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { unlockFacts, unlockedFish } from './unlocks'

const e = (profile_id: string, total_ml: number, drank_on: string, deleted_at: string | null = null) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at,
})

/** `n` consecutive 500 ml days for member `a`, starting at `from`. */
const run = (n: number, from = '2026-06-01') => Array.from({ length: n }, (_, i) => e('a', 500, addDays(from, i)))

describe('unlockedFish', () => {
  it('always includes the four starters, even with no registers', () => {
    expect([...unlockedFish([], 'a', 0)]).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
  })

  it('unlocks the streak fish at exactly 7, 30 and 100 consecutive days', () => {
    expect(unlockedFish(run(6), 'a', 0).has('pufferfish')).toBe(false)
    expect(unlockedFish(run(7), 'a', 0).has('pufferfish')).toBe(true)
    expect(unlockedFish(run(29), 'a', 0).has('clownfish')).toBe(false)
    expect(unlockedFish(run(30), 'a', 0).has('clownfish')).toBe(true)
    expect(unlockedFish(run(99), 'a', 0).has('angelfish')).toBe(false)
    expect(unlockedFish(run(100), 'a', 0).has('angelfish')).toBe(true)
  })

  it('keeps a streak fish after the streak breaks — the longest run ever counts', () => {
    expect(unlockedFish([...run(7), e('a', 500, '2026-06-20')], 'a', 0).has('pufferfish')).toBe(true)
  })

  it('needs one day strictly above 5 L for the octopus', () => {
    expect(unlockedFish([e('a', 2500, '2026-06-01'), e('a', 2500, '2026-06-01')], 'a', 0).has('octopus')).toBe(false)
    expect(unlockedFish([e('a', 2500, '2026-06-01'), e('a', 2501, '2026-06-01')], 'a', 0).has('octopus')).toBe(true)
  })

  it('unlocks by accumulated volume at 100, 500 and 1000 L', () => {
    const litres = (l: number) => Array.from({ length: l }, (_, i) => e('a', 1000, addDays('2020-01-01', i)))
    expect(unlockedFish(litres(99), 'a', 0).has('seahorse')).toBe(false)
    expect(unlockedFish(litres(100), 'a', 0).has('seahorse')).toBe(true)
    expect(unlockedFish(litres(499), 'a', 0).has('turtle')).toBe(false)
    expect(unlockedFish(litres(500), 'a', 0).has('turtle')).toBe(true)
    expect(unlockedFish(litres(999), 'a', 0).has('dolphin')).toBe(false)
    expect(unlockedFish(litres(1000), 'a', 0).has('dolphin')).toBe(true)
  })

  it('unlocks the shark after one month won and the whale after three', () => {
    expect(unlockedFish([], 'a', 0).has('shark')).toBe(false)
    expect(unlockedFish([], 'a', 1).has('shark')).toBe(true)
    expect(unlockedFish([], 'a', 2).has('whale')).toBe(false)
    expect(unlockedFish([], 'a', 3).has('whale')).toBe(true)
  })

  it('ignores deleted rows and other members', () => {
    const noise = [
      ...run(7).map((r) => ({ ...r, deleted_at: '2026-06-09T00:00:00Z' })),
      ...run(7).map((r) => ({ ...r, profile_id: 'b' })),
    ]
    expect(unlockedFish(noise, 'a', 0).has('pufferfish')).toBe(false)
  })
})

describe('unlockFacts', () => {
  it('reports the all-time facts the conditions look at', () => {
    const facts = unlockFacts([...run(3), e('a', 4000, '2026-06-02'), e('a', 100, '2026-05-01')], 'a', 2)
    expect(facts).toEqual({ longestStreak: 3, bestDayMl: 4500, totalMl: 5600, monthsWon: 2 })
  })
})
