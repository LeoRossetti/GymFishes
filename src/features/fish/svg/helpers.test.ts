import { describe, expect, it } from 'vitest'
import { dots, part, rays, scaleRows, shade, stroke, tone } from './helpers'

describe('fish art helpers', () => {
  it('part outlines a filled shape; shade clips a fill to the body; stroke has no fill', () => {
    expect(part('M0 0h10v10z', '#F00', '#800')).toEqual({ d: 'M0 0h10v10z', fill: '#F00', stroke: '#800', strokeWidth: 1.6 })
    expect(shade('M0 0h10v10z', '#900')).toEqual({ d: 'M0 0h10v10z', fill: '#900', clip: true })
    expect(stroke('M0 0L10 10', '#000', 2)).toEqual({ d: 'M0 0L10 10', fill: 'none', stroke: '#000', strokeWidth: 2 })
  })

  it('rays draws one subpath per tip, stopping short of the tip by reach', () => {
    const r = rays([0, 0], [[10, 0], [0, 10]], '#000', 0.5)
    expect(r.fill).toBe('none')
    expect(r.d).toBe('M0 0 L5 0 M0 0 L0 5')
  })

  it('scaleRows returns one clipped layer per row of arcs, offsetting odd rows', () => {
    const rows = scaleRows({ x0: 0, x1: 10, y0: 0, rows: 2, dy: 4, dx: 5, r: 2, color: () => '#0FF' })
    expect(rows).toHaveLength(2)
    expect(rows[0]?.clip).toBe(true)
    expect(rows[0]?.d).toBe('M0 -2 a2 2 0 0 0 0 4 M5 -2 a2 2 0 0 0 0 4 M10 -2 a2 2 0 0 0 0 4')
    expect(rows[1]?.d.startsWith('M2.5 2')).toBe(true)
  })

  it('dots draws circles as arcs and tone wraps a token', () => {
    expect(dots([[5, 5, 1]], '#FFF').d).toBe('M4 5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0')
    expect(tone('accent-blue')).toBe('var(--color-accent-blue)')
  })
})
