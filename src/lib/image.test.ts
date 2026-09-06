import { describe, expect, it } from 'vitest'
import { centerCropSquare, fitWithin } from './image'

describe('fitWithin', () => {
  it('leaves small images alone', () => {
    expect(fitWithin(800, 600, 1080)).toEqual({ w: 800, h: 600 })
  })
  it('scales the longest edge down to max, preserving ratio', () => {
    expect(fitWithin(4000, 3000, 1080)).toEqual({ w: 1080, h: 810 })
    expect(fitWithin(3000, 4000, 1080)).toEqual({ w: 810, h: 1080 })
  })
})

describe('centerCropSquare', () => {
  it('crops landscape horizontally centered', () => {
    expect(centerCropSquare(400, 300)).toEqual({ x: 50, y: 0, size: 300 })
  })
  it('crops portrait vertically centered', () => {
    expect(centerCropSquare(300, 401)).toEqual({ x: 0, y: 50, size: 300 })
  })
})
