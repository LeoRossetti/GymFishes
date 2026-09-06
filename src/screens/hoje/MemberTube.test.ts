import { describe, expect, it } from 'vitest'
import { fishLevel } from './MemberTube'

describe('fishLevel', () => {
  it('rides the surface exactly below the knee', () => {
    expect(fishLevel(0)).toBe(0)
    expect(fishLevel(40)).toBe(40)
    expect(fishLevel(70)).toBe(70)
  })

  it('leaves the surface smoothly, with no jump at the knee', () => {
    expect(fishLevel(71)).toBeGreaterThan(70.9)
    expect(fishLevel(71)).toBeLessThan(71)
  })

  it('settles submerged at 85 when the tube is full', () => {
    expect(fishLevel(100)).toBe(85)
  })

  it('always stays at or under the water surface', () => {
    for (let pct = 0; pct <= 100; pct += 5) {
      expect(fishLevel(pct)).toBeLessThanOrEqual(pct)
    }
  })

  it('never moves down while the water rises', () => {
    let last = -1
    for (let pct = 0; pct <= 100; pct += 1) {
      const level = fishLevel(pct)
      expect(level).toBeGreaterThanOrEqual(last)
      last = level
    }
  })
})
