import { describe, expect, it } from 'vitest'
import { fishTop, pieceVisible, surfaceYOf, SCENE_H } from './ladder'

describe('pieceVisible', () => {
  it('a floor piece shows at its step and not before', () => {
    const p = { at: 1000 }
    expect(pieceVisible(p, 1000, surfaceYOf(1000, 3000))).toBe(true)
    expect(pieceVisible(p, 999, surfaceYOf(999, 3000))).toBe(false)
  })

  it('a mid-water piece waits until the water covers it', () => {
    const p = { at: 3000, midTop: 60 }
    expect(pieceVisible(p, 3000, surfaceYOf(3000, 3000))).toBe(true)
    expect(pieceVisible(p, 3000, surfaceYOf(3000, 6000))).toBe(false)
  })
})

describe('surfaceYOf', () => {
  it('is the scene px from the top, clamped at the brim', () => {
    expect(surfaceYOf(0, 3000)).toBe(SCENE_H)
    expect(surfaceYOf(3000, 6000)).toBe(108)
    expect(surfaceYOf(9000, 3000)).toBe(0)
  })
})

describe('fishTop', () => {
  it('rides 6 px under the crest, never below water minus fish height', () => {
    expect(fishTop(220, 35)).toBe(6)
    expect(fishTop(38, 35)).toBe(3)
    expect(fishTop(35, 35)).toBe(0)
  })
})
