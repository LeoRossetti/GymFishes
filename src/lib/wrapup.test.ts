import { describe, expect, it } from 'vitest'
import { monthPeriod } from './periods'
import { monthWrapUp, wrapUpStorageKey } from './wrapup'

const e = (profile_id: string, total_ml: number, drank_on: string) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at: null,
})

describe('monthWrapUp', () => {
  it('names last month winner with totals in standings order', () => {
    const w = monthWrapUp(
      [e('a', 68_400, '2026-07-10'), e('b', 61_200, '2026-07-20'), e('b', 5000, '2026-08-01')],
      ['a', 'b'],
      '2026-08-10',
    )
    expect(w?.period.start).toBe('2026-07-01')
    expect(w?.winnerId).toBe('a')
    expect(w?.rows.map((r) => r.ml)).toEqual([68_400, 61_200])
  })

  it('is null when last month is empty', () => {
    expect(monthWrapUp([e('a', 500, '2026-08-01')], ['a', 'b'], '2026-08-10')).toBeNull()
  })

  it('has no winner on a tie', () => {
    const w = monthWrapUp([e('a', 500, '2026-07-01'), e('b', 500, '2026-07-02')], ['a', 'b'], '2026-08-10')
    expect(w?.winnerId).toBeNull()
  })

  it('looks at December from January', () => {
    expect(monthWrapUp([e('a', 500, '2025-12-31')], ['a'], '2026-01-05')?.period).toEqual({
      kind: 'month',
      start: '2025-12-01',
      end: '2025-12-31',
    })
  })
})

describe('wrapUpStorageKey', () => {
  it('is one key per month', () => {
    expect(wrapUpStorageKey(monthPeriod('2026-07-15'))).toBe('gymfishes:wrapup:2026-07')
  })
})
