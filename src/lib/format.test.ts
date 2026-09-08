import { describe, expect, it } from 'vitest'
import { formatDateLong, formatDayLong, formatDayShort, formatMonthTitle, formatPeriodLabel, formatTime, formatVolume } from './format'
import { allPeriod, dayPeriod, monthPeriod, weekPeriod } from './periods'

describe('formatVolume', () => {
  it('renders millilitres below one litre', () => {
    expect(formatVolume(0)).toBe('0 ml')
    expect(formatVolume(350)).toBe('350 ml')
    expect(formatVolume(999)).toBe('999 ml')
  })

  it('renders whole litres without a decimal', () => {
    expect(formatVolume(1000)).toBe('1 L')
    expect(formatVolume(2000)).toBe('2 L')
    expect(formatVolume(10000)).toBe('10 L')
  })

  it('renders one decimal with a comma', () => {
    expect(formatVolume(1500)).toBe('1,5 L')
    expect(formatVolume(1800)).toBe('1,8 L')
    expect(formatVolume(2050)).toBe('2,1 L')
  })

  it('rounds to the nearest 100 ml', () => {
    expect(formatVolume(1049)).toBe('1 L')
    expect(formatVolume(1050)).toBe('1,1 L')
  })
})

describe('formatDateLong', () => {
  it('renders a short weekday and month in pt-BR', () => {
    // 2026-08-10T15:00:00Z is midday Monday in Sao Paulo (UTC-3)
    expect(formatDateLong(new Date('2026-08-10T15:00:00Z'))).toBe('segunda, 10 de agosto')
  })
})

describe('formatTime', () => {
  it('renders 24-hour time in the app timezone', () => {
    expect(formatTime(new Date('2026-08-10T17:20:00Z'))).toBe('14:20')
  })
})

describe('formatDayShort', () => {
  it('renders day and short month without the dot', () => {
    expect(formatDayShort('2026-08-07')).toBe('7 ago')
    expect(formatDayShort('2026-01-15')).toBe('15 jan')
  })
})

describe('formatDayLong', () => {
  it('renders from a DayKey', () => {
    expect(formatDayLong('2026-08-10')).toBe('segunda, 10 de agosto')
  })
})

describe('formatMonthTitle', () => {
  it('capitalises the month', () => {
    expect(formatMonthTitle('2026-07-01', '2026-08-10')).toBe('Julho')
  })

  it('adds the year outside the current one', () => {
    expect(formatMonthTitle('2025-07-01', '2026-08-10')).toBe('Julho de 2025')
  })
})

describe('formatPeriodLabel', () => {
  const today = '2026-08-10'

  it('names today, yesterday, then the full date', () => {
    expect(formatPeriodLabel(dayPeriod('2026-08-10'), today)).toBe('Hoje')
    expect(formatPeriodLabel(dayPeriod('2026-08-09'), today)).toBe('Ontem')
    expect(formatPeriodLabel(dayPeriod('2026-08-07'), today)).toBe('sexta, 7 de agosto')
  })

  it('renders a week inside one month', () => {
    expect(formatPeriodLabel(weekPeriod('2026-08-04'), today)).toBe('Semana de 3–9 de agosto')
  })

  it('renders a week across two months', () => {
    expect(formatPeriodLabel(weekPeriod('2026-07-28'), today)).toBe('Semana de 27 de julho–2 de agosto')
  })

  it('renders a month', () => {
    expect(formatPeriodLabel(monthPeriod('2026-07-15'), today)).toBe('Julho')
  })

  it('renders all-time from the first register', () => {
    expect(formatPeriodLabel(allPeriod('2026-06-12', today), today)).toBe('Desde 12 de junho')
    expect(formatPeriodLabel(allPeriod('2025-06-12', today), today)).toBe('Desde 12 de junho de 2025')
  })
})
