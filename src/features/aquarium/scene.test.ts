import { describe, expect, it } from 'vitest'
import { bubbleField } from './bubbles'
import { tubeWater } from './color'
import { RIVER_SOURCES } from './art/river'
import { buildScene } from './scene'

const START = { fill: '#1CB0F6', hi: '#62CDFF' }
const WATER = tubeWater(2000, 'fresh', START)
const idsIn = (s: string) => [...s.matchAll(/ id="([^"]*)"/g)].map((m) => m[1] ?? '')
const keyframesIn = (s: string) => [...s.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1] ?? '')
const count = (s: string, needle: string) => s.split(needle).length - 1
const field = (ml: number, surfaceY = 0, prefix = 't') => bubbleField(ml, WATER, surfaceY, RIVER_SOURCES, prefix)

describe('bubbleField', () => {
  it('has no bubbles below 667 ml', () => {
    expect(field(666)).toEqual({ css: '', svg: '' })
  })

  it('lets sources join at their marks', () => {
    const at667 = count(field(667).svg, 'class="aq-bubble"')
    const at2000 = count(field(2000).svg, 'class="aq-bubble"')
    expect(at667).toBe(3)
    expect(at2000).toBe(9)
  })

  it('draws no bubble when the rise is 6 px or less', () => {
    // the first source sits at y 189: a surface at 189 - 6 - 6 leaves a 6 px rise
    expect(field(667, 177)).toEqual({ css: '', svg: '' })
    expect(count(field(667, 176).svg, 'class="aq-bubble"')).toBe(3)
  })

  it('is deterministic and names its keyframes after the prefix', () => {
    expect(field(2000)).toEqual(field(2000))
    for (const name of keyframesIn(field(2000, 0, 'x').css)) expect(name.startsWith('xu') || name.startsWith('xs')).toBe(true)
  })

  it('prints no NaN or undefined', () => {
    expect(field(2000).css + field(2000).svg).not.toMatch(/NaN|undefined/)
  })
})

describe('buildScene', () => {
  it('returns the same object for the same arguments', () => {
    expect(buildScene('fresh', 1333, 2000, START, 't')).toBe(buildScene('fresh', 1333, 2000, START, 't'))
    expect(buildScene('fresh', 1333, 2000, START, 't')).not.toBe(buildScene('fresh', 1667, 2000, START, 't'))
  })

  it('uses the tube water for the habitat and amount', () => {
    expect(buildScene('salt', 1000, 2000, START, 't').water).toEqual(tubeWater(1000, 'salt', START))
  })

  it('has an empty air below 1333 ml and a bare tube below 667 ml', () => {
    expect(buildScene('fresh', 1000, 2000, START, 't').air).toBe('')
    const plain = buildScene('fresh', 500, 2000, START, 't')
    expect(plain.scene).toBe('')
    expect(plain.bubbles).toBe('')
    expect(plain.css).toBe('')
  })

  it.each(['fresh', 'salt'] as const)('shares no id or keyframe name between prefixes (%s)', (habitat) => {
    const a = buildScene(habitat, 2000, 2000, START, 'a')
    const b = buildScene(habitat, 2000, 2000, START, 'b')
    const idsA = [...idsIn(a.scene), ...idsIn(a.air)]
    const idsB = [...idsIn(b.scene), ...idsIn(b.air)]
    expect(idsA.length).toBeGreaterThan(0)
    expect(idsA.filter((id) => idsB.includes(id))).toEqual([])
    const kfA = keyframesIn(a.css)
    expect(kfA.length).toBeGreaterThan(0)
    expect(kfA.filter((k) => keyframesIn(b.css).includes(k))).toEqual([])
  })

  it('keeps the scene and the air apart within one call', () => {
    const s = buildScene('fresh', 2000, 2000, START, 'a')
    expect(s.air).not.toBe('')
    expect(idsIn(s.scene).filter((id) => idsIn(s.air).includes(id))).toEqual([])
  })

  it('keeps the bubbles apart from the pieces, so reduced motion can leave them out', () => {
    const s = buildScene('fresh', 2000, 2000, START, 'a')
    expect(count(s.bubbles, 'aq-bubble')).toBeGreaterThan(0)
    expect(count(s.scene, 'aq-bubble')).toBe(0)
  })
})
