import { afterEach, describe, expect, it, vi } from 'vitest'
import { TUBE_STYLE_KEY, readTubeStyle, storeTubeStyle } from './tubeStyle'

describe('tube style storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('defaults to Com cenário with nothing stored', () => {
    expect(readTubeStyle()).toBe('cenario')
  })

  it('defaults to Com cenário on an unknown value', () => {
    localStorage.setItem(TUBE_STYLE_KEY, 'xyz')
    expect(readTubeStyle()).toBe('cenario')
  })

  it('defaults to Com cenário when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readTubeStyle()).toBe('cenario')
  })

  it('reads a stored Só água', () => {
    localStorage.setItem(TUBE_STYLE_KEY, 'agua')
    expect(readTubeStyle()).toBe('agua')
  })

  it('stores the pick, and does not throw when storage is blocked', () => {
    storeTubeStyle('agua')
    expect(localStorage.getItem(TUBE_STYLE_KEY)).toBe('agua')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => storeTubeStyle('cenario')).not.toThrow()
  })
})
