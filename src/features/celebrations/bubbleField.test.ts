import { describe, expect, it } from 'vitest'
import { bubbleField } from './bubbleField'

describe('bubbleField', () => {
  it('is the same irregular field on every run', () => {
    expect(bubbleField()).toEqual(bubbleField())
    expect(bubbleField(14, 7)).not.toEqual(bubbleField(14, 8))
  })

  it('spreads fourteen bubbles of varied size, timing and drift across the width', () => {
    const field = bubbleField()
    expect(field).toHaveLength(14)
    expect(new Set(field.map((b) => b.size)).size).toBeGreaterThanOrEqual(5)
    expect(new Set(field.map((b) => b.delay)).size).toBeGreaterThanOrEqual(10)
    expect(field.some((b) => b.sway < 0) && field.some((b) => b.sway > 0)).toBe(true)
    for (const b of field) {
      expect(b.left).toBeGreaterThanOrEqual(4)
      expect(b.left).toBeLessThanOrEqual(96)
      expect(b.size).toBeGreaterThanOrEqual(6)
      expect(b.size).toBeLessThanOrEqual(28)
      expect(b.delay).toBeGreaterThanOrEqual(0)
      expect(b.delay).toBeLessThanOrEqual(1.2)
      expect(b.duration).toBeGreaterThanOrEqual(1.6)
      expect(b.duration).toBeLessThanOrEqual(2.6)
      expect(b.rise).toBeGreaterThanOrEqual(340)
      expect(b.rise).toBeLessThanOrEqual(640)
      expect(Math.abs(b.sway)).toBeGreaterThanOrEqual(4)
      expect(Math.abs(b.sway)).toBeLessThanOrEqual(14)
    }
  })

  it('keeps most bubbles small', () => {
    const small = bubbleField().filter((b) => b.size <= 12).length
    expect(small).toBeGreaterThanOrEqual(8)
  })
})
