import { describe, expect, it } from 'vitest'
import { statsFor } from './averages'
import { weekPeriod } from './periods'

const e = (profile_id: string, total_ml: number, drank_on: string, deleted_at: string | null = null) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at,
})

const week = weekPeriod('2026-08-10') // 10–16 de agosto
const entries = [
  e('a', 2000, '2026-08-10'),
  e('a', 1000, '2026-08-10'),
  e('a', 4000, '2026-08-12'),
  e('b', 500, '2026-08-11'),
  e('a', 9000, '2026-08-05'), // last week
  e('a', 9000, '2026-08-13', '2026-08-13T20:00:00Z'), // deleted
]

describe('statsFor', () => {
  it('divides by days elapsed, not days registered', () => {
    const s = statsFor(entries, week, '2026-08-13', 'a')
    expect(s.totalMl).toBe(7000)
    expect(s.daysElapsed).toBe(4)
    expect(s.daysRegistered).toBe(2)
    expect(s.averageMl).toBe(1750)
  })

  it('finds the best day and counts registers', () => {
    const s = statsFor(entries, week, '2026-08-13', 'a')
    expect(s.bestDay).toEqual({ day: '2026-08-12', ml: 4000 })
    expect(s.registers).toBe(3)
  })

  it('breaks a best-day tie towards the earlier day', () => {
    const s = statsFor([e('a', 1000, '2026-08-12'), e('a', 1000, '2026-08-10')], week, '2026-08-16', 'a')
    expect(s.bestDay).toEqual({ day: '2026-08-10', ml: 1000 })
  })

  it('is all zeros for a silent member', () => {
    expect(statsFor(entries, week, '2026-08-13', 'c')).toEqual({
      totalMl: 0,
      averageMl: 0,
      bestDay: null,
      daysRegistered: 0,
      daysElapsed: 4,
      registers: 0,
    })
  })

  it('uses the full length of a finished period', () => {
    expect(statsFor(entries, weekPeriod('2026-08-03'), '2026-08-13', 'a').daysElapsed).toBe(7)
  })
})
