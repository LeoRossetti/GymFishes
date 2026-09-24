import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { THEMES } from './themes'
import { THEME_STORAGE_KEY, applyTheme, readStoredTheme, storeTheme } from './theme'
import { useTheme } from './useTheme'

function meta(): HTMLMetaElement {
  let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!m) {
    m = document.createElement('meta')
    m.name = 'theme-color'
    document.head.appendChild(m)
  }
  return m
}

describe('theme (spec M7 §7.1)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    meta().content = ''
  })
  afterEach(() => vi.restoreAllMocks())

  it('defaults to Fundo do mar when nothing is stored', () => {
    expect(readStoredTheme()).toBe('fundo-do-mar')
  })

  it('falls back to the default for an id this build does not know', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon-verde')
    expect(readStoredTheme()).toBe('fundo-do-mar')
  })

  it('reads a stored theme back', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'areia')
    expect(readStoredTheme()).toBe('areia')
  })

  it('applyTheme sets data-theme on <html> and the status-bar colour', () => {
    applyTheme('breu')
    expect(document.documentElement.dataset.theme).toBe('breu')
    expect(meta().content).toBe(THEMES.breu.bg)
  })

  it('survives a blocked localStorage: stays on the default and still applies a tap', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredTheme()).toBe('fundo-do-mar')
    expect(() => storeTheme('tinta')).not.toThrow()
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('tinta'))
    expect(result.current.theme).toBe('tinta')
    expect(document.documentElement.dataset.theme).toBe('tinta')
  })

  it('useTheme persists the pick and applies it', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('fundo-do-mar')
    act(() => result.current.setTheme('meia-noite'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('meia-noite')
    expect(document.documentElement.dataset.theme).toBe('meia-noite')
    expect(meta().content).toBe(THEMES['meia-noite'].bg)
  })
})
