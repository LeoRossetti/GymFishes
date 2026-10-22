import { describe, expect, it } from 'vitest'
import { progressText } from './progress'

describe('progressText', () => {
  it('a streak counts whole days', () => {
    expect(progressText({ kind: 'streak', days: 30 }, { current: 12, target: 30 })).toBe('12 de 30')
  })

  it('a volume shows whole litres, rounded down so it never claims a litre not yet drunk', () => {
    expect(progressText({ kind: 'volume', ml: 100_000 }, { current: 99_999, target: 100_000 })).toBe('99 de 100')
  })

  it('a record shows litres with one decimal comma, rounded down', () => {
    expect(progressText({ kind: 'record', ml: 3500 }, { current: 3499, target: 3500 })).toBe('3,4 de 3,5')
  })
})
