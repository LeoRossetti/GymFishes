import { describe, expect, it } from 'vitest'
import { FISH_H, FISH_W, TUBE_H, fishBottomPx } from './MemberTube'

describe('fishBottomPx', () => {
  it('draws a fish a third of the tube wide', () => {
    expect(FISH_W).toBe(44)
    expect(FISH_H).toBeCloseTo((44 * 40) / 64)
  })

  it('sits on the bottom while the water is shallower than the fish', () => {
    expect(fishBottomPx(0)).toBe(0)
    expect(fishBottomPx(5)).toBe(0)
  })

  it('keeps the fish under the surface once there is room', () => {
    for (let pct = 20; pct <= 100; pct += 5) {
      const water = (pct / 100) * TUBE_H
      expect(fishBottomPx(pct) + FISH_H).toBeLessThanOrEqual(water)
    }
  })

  it('stays fully inside the tube when the tube is full', () => {
    expect(fishBottomPx(100) + FISH_H).toBeLessThanOrEqual(TUBE_H)
  })

  it('never moves down while the water rises', () => {
    let last = -1
    for (let pct = 0; pct <= 100; pct += 1) {
      const bottom = fishBottomPx(pct)
      expect(bottom).toBeGreaterThanOrEqual(last)
      last = bottom
    }
  })
})
