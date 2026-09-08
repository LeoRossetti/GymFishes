import { describe, expect, it } from 'vitest'
import { fillStep, monthCells } from './calendar'
import { monthPeriod } from './periods'

describe('fillStep', () => {
  it('maps totals to the five flat steps', () => {
    expect(fillStep(0)).toBe(0)
    expect(fillStep(1)).toBe(1)
    expect(fillStep(999)).toBe(1)
    expect(fillStep(1000)).toBe(2)
    expect(fillStep(1999)).toBe(2)
    expect(fillStep(2000)).toBe(3)
    expect(fillStep(2999)).toBe(3)
    expect(fillStep(3000)).toBe(4)
    expect(fillStep(9000)).toBe(4)
  })
})

describe('monthCells', () => {
  it('pads August 2026 with five blanks — it starts on a Saturday', () => {
    const cells = monthCells(monthPeriod('2026-08-01'))
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, '2026-08-01'])
    expect(cells).toHaveLength(36)
    expect(cells.at(-1)).toBe('2026-08-31')
  })

  it('has no blanks when the month starts on a Monday', () => {
    expect(monthCells(monthPeriod('2026-06-01'))[0]).toBe('2026-06-01')
  })
})
