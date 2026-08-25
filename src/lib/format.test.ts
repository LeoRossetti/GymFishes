import { describe, expect, it } from 'vitest'
import { formatDateLong, formatTime, formatVolume } from './format'

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
