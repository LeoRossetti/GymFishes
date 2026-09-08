import { describe, expect, it } from 'vitest'
import { addDays, dateAtNoon, dayKey, daysBetween, fromDatetimeLocal, pad2, parseDayKey, toDatetimeLocal, weekdayMon0 } from './dates'

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

describe('toDatetimeLocal', () => {
  it('formats an instant as São Paulo wall time', () => {
    // 2026-01-15T03:30Z is 00:30 in São Paulo (-03:00)
    expect(toDatetimeLocal(new Date('2026-01-15T03:30:00Z'))).toBe('2026-01-15T00:30')
  })

  it('formats midnight as 00:00, never 24:00', () => {
    // 2026-01-15T03:00:00Z is exactly 00:00 in São Paulo (-03:00)
    expect(toDatetimeLocal(new Date('2026-01-15T03:00:00Z'))).toBe('2026-01-15T00:00')
  })
})

describe('fromDatetimeLocal', () => {
  it('parses São Paulo wall time back to the same instant', () => {
    const d = fromDatetimeLocal('2026-01-15T00:30')
    expect(d.toISOString()).toBe('2026-01-15T03:30:00.000Z')
  })
  it('round-trips', () => {
    const now = new Date('2026-08-11T18:04:00Z')
    expect(fromDatetimeLocal(toDatetimeLocal(now)).getTime()).toBe(now.getTime())
  })
})

describe('daysBetween', () => {
  it('counts forward and backward', () => {
    expect(daysBetween('2026-08-10', '2026-08-10')).toBe(0)
    expect(daysBetween('2026-08-10', '2026-08-16')).toBe(6)
    expect(daysBetween('2026-08-16', '2026-08-10')).toBe(-6)
  })

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
    expect(daysBetween('2026-06-12', '2026-08-10')).toBe(59)
  })
})

describe('dateAtNoon', () => {
  it('lands on the same São Paulo day', () => {
    expect(dayKey(dateAtNoon('2026-08-10'))).toBe('2026-08-10')
    expect(dateAtNoon('2026-08-10').toISOString()).toBe('2026-08-10T15:00:00.000Z')
  })
})
