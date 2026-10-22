import { describe, expect, it } from 'vitest'
import { FULL_ML, HABITAT_WATER, mixOklab, tubeWater } from './color'

const START = { fill: '#1CB0F6', hi: '#62CDFF' }

describe('mixOklab', () => {
  it('returns the ends at t=0 and t=1, in uppercase hex', () => {
    expect(mixOklab('#1cb0f6', '#2a9c80', 0)).toBe('#1CB0F6')
    expect(mixOklab('#1cb0f6', '#2a9c80', 1)).toBe('#2A9C80')
  })

  it('matches the reference mix at the midpoint', () => {
    expect(mixOklab('#1CB0F6', '#2A9C80', 0.5)).toBe('#20A7BB')
  })
})

describe('tubeWater', () => {
  it('keeps the theme water at 0 ml and for negative amounts', () => {
    expect(tubeWater(0, 'fresh', START)).toEqual(START)
    expect(tubeWater(-100, 'salt', START)).toEqual(START)
  })

  it('reaches the habitat water at 3 L and stays there', () => {
    expect(FULL_ML).toBe(3000)
    for (const h of ['fresh', 'salt'] as const) {
      expect(tubeWater(3000, h, START)).toEqual(HABITAT_WATER[h])
      expect(tubeWater(5000, h, START)).toEqual(HABITAT_WATER[h])
    }
  })

  it('is halfway at 1,5 L, for fill and highlight', () => {
    for (const h of ['fresh', 'salt'] as const) {
      expect(tubeWater(1500, h, START)).toEqual({
        fill: mixOklab(START.fill, HABITAT_WATER[h].fill, 0.5),
        hi: mixOklab(START.hi, HABITAT_WATER[h].hi, 0.5),
      })
    }
  })
})
