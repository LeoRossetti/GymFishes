import { describe, expect, it } from 'vitest'
import { bubbleField } from './bubbles'
import { tubeWater } from './color'
import { RIVER_SOURCES } from './art/river'
import { buildScene } from './scene'

const START = { fill: '#1CB0F6', hi: '#62CDFF' }
const WATER = tubeWater(3000, 'fresh', START)
const idsIn = (s: string) => [...s.matchAll(/ id="([^"]*)"/g)].map((m) => m[1] ?? '')
const keyframesIn = (s: string) => [...s.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1] ?? '')
const count = (s: string, needle: string) => s.split(needle).length - 1
const field = (ml: number, surfaceY = 0, prefix = 't') => bubbleField(ml, WATER, surfaceY, RIVER_SOURCES, prefix)

describe('bubbleField', () => {
  it('has no bubbles below 1000 ml', () => {
    expect(field(900)).toEqual({ css: '', svg: '' })
  })

  it('lets sources join at their marks', () => {
    const at1000 = count(field(1000).svg, 'class="aq-bubble"')
    const at3000 = count(field(3000).svg, 'class="aq-bubble"')
    expect(at1000).toBe(3)
    expect(at3000).toBe(9)
  })

  it('draws no bubble when the rise is 6 px or less', () => {
    // the 1 L source sits at y 189: a surface at 189 - 6 - 6 leaves a 6 px rise
    expect(field(1000, 177)).toEqual({ css: '', svg: '' })
    expect(count(field(1000, 176).svg, 'class="aq-bubble"')).toBe(3)
  })

  it('is deterministic and names its keyframes after the prefix', () => {
    expect(field(3000)).toEqual(field(3000))
    for (const name of keyframesIn(field(3000, 0, 'x').css)) expect(name.startsWith('xu') || name.startsWith('xs')).toBe(true)
  })

  it('prints no NaN or undefined', () => {
    expect(field(3000).css + field(3000).svg).not.toMatch(/NaN|undefined/)
  })
})

describe('buildScene', () => {
  it('returns the same object for the same arguments', () => {
    expect(buildScene('fresh', 2000, 3000, START, 't')).toBe(buildScene('fresh', 2000, 3000, START, 't'))
    expect(buildScene('fresh', 2000, 3000, START, 't')).not.toBe(buildScene('fresh', 2500, 3000, START, 't'))
  })

  it('uses the tube water for the habitat and amount', () => {
    expect(buildScene('salt', 1500, 3000, START, 't').water).toEqual(tubeWater(1500, 'salt', START))
  })

  it('has an empty air below 2000 ml and a bare tube below 1000 ml', () => {
    expect(buildScene('fresh', 1500, 3000, START, 't').air).toBe('')
    const plain = buildScene('fresh', 500, 3000, START, 't')
    expect(plain.scene).toBe('')
    expect(plain.css).toBe('')
  })

  it.each(['fresh', 'salt'] as const)('shares no id or keyframe name between prefixes (%s)', (habitat) => {
    const a = buildScene(habitat, 3000, 3000, START, 'a')
    const b = buildScene(habitat, 3000, 3000, START, 'b')
    const idsA = [...idsIn(a.scene), ...idsIn(a.air)]
    const idsB = [...idsIn(b.scene), ...idsIn(b.air)]
    expect(idsA.length).toBeGreaterThan(0)
    expect(idsA.filter((id) => idsB.includes(id))).toEqual([])
    const kfA = keyframesIn(a.css)
    expect(kfA.length).toBeGreaterThan(0)
    expect(kfA.filter((k) => keyframesIn(b.css).includes(k))).toEqual([])
  })

  it('keeps the scene and the air apart within one call', () => {
    const s = buildScene('fresh', 3000, 3000, START, 'a')
    expect(s.air).not.toBe('')
    expect(idsIn(s.scene).filter((id) => idsIn(s.air).includes(id))).toEqual([])
  })

  it('puts the bubbles in the scene', () => {
    expect(count(buildScene('fresh', 3000, 3000, START, 'a').scene, 'aq-bubble')).toBeGreaterThan(0)
  })
})
