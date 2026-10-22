import { describe, expect, it } from 'vitest'
import { tubeWater } from '../color'
import { surfaceYOf } from '../ladder'
import { idSpace } from './prims'
import { reefInAir, reefScene } from './reef'

const START = { fill: '#1CB0F6', hi: '#62CDFF' }
const STEPS = [500, 1000, 1500, 2000, 2500, 3000]
const water = (ml: number) => tubeWater(ml, 'salt', START)
const scene = (ml: number, prefix = 't') => reefScene(ml, water(ml), surfaceYOf(ml, 3000), idSpace(prefix))
const idsIn = (svg: string) => [...svg.matchAll(/ id="([^"]*)"/g)].map((m) => m[1] ?? '')

describe('reefScene', () => {
  it('is plain water at 0,5 L', () => {
    expect(scene(500)).toBe('')
  })

  it('never prints NaN or undefined', () => {
    for (const ml of STEPS) {
      expect(scene(ml)).not.toMatch(/NaN|undefined/)
    }
  })

  it('grows at every step from 1 L to 3 L', () => {
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

  it('brings the school and the two jellyfish at 3 L, not before', () => {
    for (const name of ['school', 'jellyfish-1', 'jellyfish-2']) {
      expect(scene(3000)).toContain(`data-piece="${name}"`)
      expect(scene(2500)).not.toContain(`data-piece="${name}"`)
    }
  })

  it('keeps the school and the jellyfish away until the water covers them', () => {
    const low = reefScene(3000, water(3000), 150, idSpace('t'))
    expect(low).toContain('data-piece="sand"')
    for (const name of ['school', 'jellyfish-1', 'jellyfish-2']) {
      expect(low).not.toContain(`data-piece="${name}"`)
    }
  })
})

describe('reefInAir', () => {
  it('has the chain from 2 L on', () => {
    expect(reefInAir(1999, water(1999), idSpace('c'))).toBe('')
    const air = reefInAir(2000, water(2000), idSpace('c'))
    expect(air.startsWith('<g data-piece="chain">')).toBe(true)
    expect(air).not.toMatch(/NaN|undefined/)
    for (const id of idsIn(air)) expect(id.startsWith('c')).toBe(true)
  })
})
