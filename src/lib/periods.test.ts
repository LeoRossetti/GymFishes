import { describe, expect, it } from 'vitest'
import {
  allPeriod,
  containsDay,
  currentPeriod,
  dayPeriod,
  daysElapsed,
  daysOf,
  monthPeriod,
  stepPeriod,
  weekPeriod,
} from './periods'

describe('weekPeriod', () => {
  it('runs Monday to Sunday from a Monday', () => {
    expect(weekPeriod('2026-08-10')).toEqual({
      kind: 'week',
      start: '2026-08-10',
      end: '2026-08-16',
    })
  })

  it('returns the same week from a Sunday', () => {
    expect(weekPeriod('2026-08-16')).toEqual({
      kind: 'week',
      start: '2026-08-10',
      end: '2026-08-16',
    })
  })

  it('puts the previous Sunday in the previous week', () => {
    expect(weekPeriod('2026-08-09')).toEqual({
      kind: 'week',
      start: '2026-08-03',
      end: '2026-08-09',
    })
  })
})

describe('monthPeriod', () => {
  it('spans the whole month', () => {
    expect(monthPeriod('2026-08-10')).toEqual({
      kind: 'month',
      start: '2026-08-01',
      end: '2026-08-31',
    })
  })

  it('handles a leap February', () => {
    expect(monthPeriod('2028-02-05').end).toBe('2028-02-29')
  })

  it('handles a non-leap February', () => {
    expect(monthPeriod('2026-02-05').end).toBe('2026-02-28')
  })
})

describe('stepPeriod', () => {
  it('steps days', () => {
    expect(stepPeriod(dayPeriod('2026-08-10'), -1).start).toBe('2026-08-09')
  })

  it('steps weeks across a month boundary', () => {
    expect(stepPeriod(weekPeriod('2026-08-03'), -1)).toEqual({
      kind: 'week',
      start: '2026-07-27',
      end: '2026-08-02',
    })
  })

  it('steps months across a year boundary', () => {
    expect(stepPeriod(monthPeriod('2026-01-15'), -1)).toEqual({
      kind: 'month',
      start: '2025-12-01',
      end: '2025-12-31',
    })
    expect(stepPeriod(monthPeriod('2026-12-15'), 1)).toEqual({
      kind: 'month',
      start: '2027-01-01',
      end: '2027-01-31',
    })
  })

  it('leaves the all-time period unchanged', () => {
    const all = allPeriod('2026-06-12', '2026-08-10')
    expect(stepPeriod(all, -1)).toEqual(all)
  })
})

describe('containsDay', () => {
  it('includes both boundaries and excludes outside days', () => {
    const week = weekPeriod('2026-08-10')
    expect(containsDay(week, '2026-08-10')).toBe(true)
    expect(containsDay(week, '2026-08-16')).toBe(true)
    expect(containsDay(week, '2026-08-09')).toBe(false)
    expect(containsDay(week, '2026-08-17')).toBe(false)
  })
})

describe('daysOf', () => {
  it('lists every day of a week', () => {
    expect(daysOf(weekPeriod('2026-08-10'))).toEqual([
      '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16',
    ])
  })

  it('has 31 days in August', () => {
    expect(daysOf(monthPeriod('2026-08-10'))).toHaveLength(31)
  })
})

describe('daysElapsed', () => {
  it('counts a finished period in full', () => {
    expect(daysElapsed(weekPeriod('2026-08-03'), '2026-08-10')).toBe(7)
  })

  it('counts the current period only up to today', () => {
    expect(daysElapsed(weekPeriod('2026-08-10'), '2026-08-12')).toBe(3)
  })

  it('is one on the first day', () => {
    expect(daysElapsed(monthPeriod('2026-08-01'), '2026-08-01')).toBe(1)
  })

  it('is zero for a period that has not started', () => {
    expect(daysElapsed(monthPeriod('2026-09-01'), '2026-08-31')).toBe(0)
  })

  it('runs from the first register for the all-time period', () => {
    expect(daysElapsed(allPeriod('2026-06-12', '2026-08-10'), '2026-08-10')).toBe(60)
  })
})

describe('currentPeriod', () => {
  it('builds the period of each kind around today', () => {
    expect(currentPeriod('day', '2026-08-12', '2026-06-12')).toEqual(dayPeriod('2026-08-12'))
    expect(currentPeriod('week', '2026-08-12', '2026-06-12')).toEqual(weekPeriod('2026-08-12'))
    expect(currentPeriod('month', '2026-08-12', '2026-06-12')).toEqual(monthPeriod('2026-08-12'))
    expect(currentPeriod('all', '2026-08-12', '2026-06-12')).toEqual(allPeriod('2026-06-12', '2026-08-12'))
  })
})
