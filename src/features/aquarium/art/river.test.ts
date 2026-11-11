import { describe, expect, it } from 'vitest'
import { tubeWater } from '../color'
import { surfaceYOf } from '../ladder'
import { idSpace } from './prims'
import { riverInAir, riverScene } from './river'

const START = { fill: '#1CB0F6', hi: '#62CDFF' }
const STEPS = [500, 667, 1000, 1333, 1667, 2000]
const water = (ml: number) => tubeWater(ml, 'fresh', START)
const scene = (ml: number, prefix = 't') => riverScene(ml, water(ml), surfaceYOf(ml, 2000), idSpace(prefix))
const idsIn = (svg: string) => [...svg.matchAll(/ id="([^"]*)"/g)].map((m) => m[1] ?? '')

describe('riverScene', () => {
  it('is plain water at 0,5 L', () => {
    expect(scene(500)).toBe('')
  })

  it('never prints NaN or undefined', () => {
    for (const ml of STEPS) {
      expect(scene(ml)).not.toMatch(/NaN|undefined/)
    }
  })

  it('grows at every step from 0,67 L to 2 L', () => {
    const sizes = STEPS.slice(1).map((ml) => scene(ml).length)
    sizes.slice(1).forEach((size, i) => expect(size).toBeGreaterThan(sizes[i] ?? Infinity))
  })

  it('names every id with the tube prefix', () => {
    for (const ml of STEPS.slice(1)) {
      const ids = idsIn(scene(ml, 'q7'))
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) expect(id.startsWith('q7')).toBe(true)
    }
  })

  it('brings the school at 2 L, not before', () => {
    expect(scene(2000)).toContain('data-piece="school"')
    expect(scene(1667)).not.toContain('data-piece="school"')
  })

  it('keeps the school away until the water covers it', () => {
    const low = riverScene(2000, water(2000), 150, idSpace('t'))
    expect(low).toContain('data-piece="bed"')
    expect(low).not.toContain('data-piece="school"')
  })
})

describe('riverInAir', () => {
  it('has the roots from 1,33 L on', () => {
    expect(riverInAir(1332, water(1332), idSpace('a'))).toBe('')
    const air = riverInAir(1333, water(1333), idSpace('a'))
    expect(air.startsWith('<g data-piece="roots">')).toBe(true)
    expect(air).not.toMatch(/NaN|undefined/)
    for (const id of idsIn(air)) expect(id.startsWith('a')).toBe(true)
  })
})
