import { describe, expect, it } from 'vitest'
import { FISH_IDS } from '@/features/fish/catalog'
import { addDays } from '@/lib/dates'
import { dayStateOf } from './dayState'

const today = '2026-09-08'
const ids = ['a', 'b']
const e = (profile_id: string, total_ml: number, drank_on: string) => ({ profile_id, total_ml, drank_on, deleted_at: null })

describe('dayStateOf', () => {
  it('starts empty with every fish available', () => {
    expect(dayStateOf([], ids, 'a', today)).toEqual({
      todayMl: 0,
      bestOtherDayMl: 0,
      leading: false,
      streakDays: 0,
      unlocked: new Set(FISH_IDS),
    })
  })

  it('sums today and takes the best day from other days only', () => {
    const s = dayStateOf(
      [e('a', 1000, today), e('a', 800, today), e('a', 4000, addDays(today, -3)), e('a', 3000, addDays(today, -1))],
      ids,
      'a',
      today,
    )
    expect(s.todayMl).toBe(1800)
    expect(s.bestOtherDayMl).toBe(4000)
  })

  it('leads only when ahead of a partner who registered today', () => {
    expect(dayStateOf([e('a', 500, today)], ids, 'a', today).leading).toBe(false)
    expect(dayStateOf([e('a', 500, today), e('b', 300, today)], ids, 'a', today).leading).toBe(true)
    expect(dayStateOf([e('a', 300, today), e('b', 300, today)], ids, 'a', today).leading).toBe(false)
    expect(dayStateOf([e('a', 500, today), e('b', 300, addDays(today, -1))], ids, 'a', today).leading).toBe(false)
  })

  it('reports the streak as of today, or as of yesterday while today is empty', () => {
    const run = [e('a', 500, addDays(today, -2)), e('a', 500, addDays(today, -1))]
    expect(dayStateOf(run, ids, 'a', today).streakDays).toBe(2)
    expect(dayStateOf([...run, e('a', 500, today)], ids, 'a', today).streakDays).toBe(3)
  })

  it('keeps every fish available whatever the registers say', () => {
    const week = Array.from({ length: 7 }, (_, i) => e('a', 500, addDays(today, -i)))
    expect(dayStateOf(week, ids, 'a', today).unlocked.size).toBe(FISH_IDS.length)
  })
})
