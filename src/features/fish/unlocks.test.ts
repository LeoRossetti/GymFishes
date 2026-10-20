import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { availableFish, unlockFacts, unlockedFish, type UnlockEntry } from './unlocks'

const STARTERS = ['guppy', 'betta', 'goldfish', 'neon']

const e = (
  profile_id: string,
  total_ml: number,
  drank_on: string,
  extra: Partial<Pick<UnlockEntry, 'deleted_at' | 'drank_at' | 'note' | 'composition'>> = {},
): UnlockEntry => ({ profile_id, total_ml, drank_on, deleted_at: null, ...extra })

/** `n` consecutive 500 ml days for member `a`, starting at `from`. */
const run = (n: number, from = '2026-06-01') => Array.from({ length: n }, (_, i) => e('a', 500, addDays(from, i)))

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

  it('needs one day strictly above 3 L for the turtle', () => {
    expect(unlockedFish([e('a', 1500, '2026-06-01'), e('a', 1500, '2026-06-01')], 'a').has('turtle')).toBe(false)
    expect(unlockedFish([e('a', 1500, '2026-06-01'), e('a', 1501, '2026-06-01')], 'a').has('turtle')).toBe(true)
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
    )
    expect(facts).toEqual({
      longestStreak: 3,
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
      bestDayMl: 0,
      totalMl: 0,
      registers: 0,
      usedBottle: false,
      wroteNote: false,
      earliestHour: 24,
    })
  })
})
