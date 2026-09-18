import { describe, expect, it } from 'vitest'
import { longestStreak, registeredDays, streakOf } from './streaks'

const days = (...k: string[]) => new Set(k)

describe('streakOf', () => {
  it('counts today and the consecutive days before it', () => {
    expect(streakOf(days('2026-08-08', '2026-08-09', '2026-08-10'), '2026-08-10')).toEqual({ days: 3, atRisk: false })
  })

  it('shows yesterday value, at risk, while today is not logged', () => {
    expect(streakOf(days('2026-08-08', '2026-08-09'), '2026-08-10')).toEqual({ days: 2, atRisk: true })
  })

  it('breaks only once yesterday is also empty', () => {
    expect(streakOf(days('2026-08-07', '2026-08-08'), '2026-08-10')).toEqual({ days: 0, atRisk: false })
  })

  it('stops at a gap', () => {
    expect(streakOf(days('2026-08-05', '2026-08-06', '2026-08-08', '2026-08-09', '2026-08-10'), '2026-08-10').days).toBe(3)
  })

  it('crosses month and year boundaries', () => {
    expect(streakOf(days('2026-07-31', '2026-08-01'), '2026-08-01').days).toBe(2)
    expect(streakOf(days('2025-12-31', '2026-01-01'), '2026-01-01').days).toBe(2)
  })

  it('is 0 with no registers at all', () => {
    expect(streakOf(days(), '2026-08-10')).toEqual({ days: 0, atRisk: false })
  })
})

describe('longestStreak', () => {
  it('is 0 with no days', () => {
    expect(longestStreak(days())).toBe(0)
  })

  it('finds the longest run anywhere in history', () => {
    const history = days(
      '2026-06-01', '2026-06-02', '2026-06-03',
      '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14',
      '2026-06-20',
    )
    expect(longestStreak(history)).toBe(5)
  })
})

describe('registeredDays', () => {
  it('collects the days one member has live registers on', () => {
    const e = (profile_id: string, drank_on: string, deleted_at: string | null = null) => ({ profile_id, total_ml: 500, drank_on, deleted_at })
    expect(
      registeredDays([e('a', '2026-08-01'), e('a', '2026-08-01'), e('a', '2026-08-03'), e('a', '2026-08-04', 'x'), e('b', '2026-08-05')], 'a'),
    ).toEqual(days('2026-08-01', '2026-08-03'))
  })
})
