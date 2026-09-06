import { describe, expect, it } from 'vitest'
import { MAX_ML, pressKey } from './keypad'

describe('pressKey', () => {
  it('appends digits calculator-style', () => {
    expect(pressKey(0, '2')).toBe(2)
    expect(pressKey(2, '5')).toBe(25)
    expect(pressKey(25, '0')).toBe(250)
  })
  it('handles the 00 key', () => {
    expect(pressKey(5, '00')).toBe(500)
    expect(pressKey(0, '00')).toBe(0)
  })
  it('backspaces', () => {
    expect(pressKey(250, 'back')).toBe(25)
    expect(pressKey(0, 'back')).toBe(0)
  })
  it('ignores input that would exceed MAX_ML', () => {
    expect(pressKey(MAX_ML, '0')).toBe(MAX_ML)
    expect(pressKey(2001, '00')).toBe(2001)
  })
})
