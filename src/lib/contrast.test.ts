import { describe, expect, it } from 'vitest'
import { THEMES, THEME_IDS } from '@/features/theme/themes'
import { contrastRatio, lightness, lightnessDelta } from './contrast'

describe('contrast math', () => {
  it('white on black is 21:1 and black on itself is 1:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#000000', '#000000')).toBe(1)
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('CIE lightness runs from 0 for black to 100 for white', () => {
    expect(lightness('#000000')).toBe(0)
    expect(lightness('#FFFFFF')).toBeCloseTo(100, 0)
    expect(lightness('#777777')).toBeCloseTo(50, 0)
    expect(lightnessDelta('#000000', '#FFFFFF')).toBeCloseTo(100, 0)
  })

  it('accepts lowercase and three-digit hex', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1)
  })
})

/** Spec M7 §7.6 — the guard for every theme, present and future. */
describe.each(THEME_IDS)('theme %s', (id) => {
  const t = THEMES[id]
  it('text on cards is readable', () => {
    expect(contrastRatio(t.ink, t.surface)).toBeGreaterThanOrEqual(7)
    expect(contrastRatio(t.ink2, t.surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t.ink2, t.bg)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t.ink3, t.surface)).toBeGreaterThanOrEqual(3)
  })
  it('water reads on the background and on cards, and text reads on water', () => {
    expect(contrastRatio(t.water, t.bg)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(t.water, t.surface)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(t.inkOnWater, t.water)).toBeGreaterThanOrEqual(4.5)
  })
  it('cards, chips and borders are visible steps, not the same slab', () => {
    expect(lightnessDelta(t.surface, t.bg)).toBeGreaterThanOrEqual(5)
    expect(lightnessDelta(t.surface2, t.surface)).toBeGreaterThanOrEqual(4)
    expect(lightnessDelta(t.line, t.surface)).toBeGreaterThanOrEqual(5)
  })
})
