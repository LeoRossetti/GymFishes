import { describe, expect, it } from 'vitest'
import { addDays, dayKey, pad2, parseDayKey, weekdayMon0 } from './dates'

describe('dayKey', () => {
  it('uses the Sao Paulo calendar day, not UTC', () => {
    // 02:00 UTC on the 11th is still 23:00 on the 10th in Sao Paulo
    expect(dayKey(new Date('2026-08-11T02:00:00Z'))).toBe('2026-08-10')
    expect(dayKey(new Date('2026-08-11T04:00:00Z'))).toBe('2026-08-11')
  })
})

describe('pad2', () => {
  it('pads single digits', () => {
    expect(pad2(1)).toBe('01')
    expect(pad2(12)).toBe('12')
  })
})

describe('parseDayKey', () => {
  it('splits into numeric parts', () => {
    expect(parseDayKey('2026-08-10')).toEqual({ y: 2026, m: 8, d: 10 })
  })
})

describe('addDays', () => {
  it('moves forward and backward', () => {
    expect(addDays('2026-08-10', 1)).toBe('2026-08-11')
    expect(addDays('2026-08-10', -1)).toBe('2026-08-09')
  })

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01')
  })
})

describe('weekdayMon0', () => {
  it('treats Monday as zero', () => {
    expect(weekdayMon0('2026-08-10')).toBe(0) // Monday
    expect(weekdayMon0('2026-08-16')).toBe(6) // Sunday
  })
})
