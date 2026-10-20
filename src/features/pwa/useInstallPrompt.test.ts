import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInstallPrompt } from './useInstallPrompt'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

function stubEnv(userAgent: string, standalone: boolean) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
  vi.stubGlobal('matchMedia', () => ({ matches: standalone }))
}

function offer() {
  const prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
  act(() => {
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt }))
  })
  return prompt
}

describe('useInstallPrompt', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('offers install only after the browser event, once per event', async () => {
    stubEnv(DESKTOP, false)
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.install).toBeNull()
    const prompt = offer()
    expect(result.current.install).not.toBeNull()
    await act(() => result.current.install!())
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(result.current.install).toBeNull()
  })

  it('appinstalled withdraws the offer', () => {
    stubEnv(DESKTOP, false)
    const { result } = renderHook(() => useInstallPrompt())
    offer()
    expect(result.current.install).not.toBeNull()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(result.current.install).toBeNull()
  })

  it('standalone ignores the event and never hints', () => {
    stubEnv(IPHONE, true)
    const { result } = renderHook(() => useInstallPrompt())
    offer()
    expect(result.current.install).toBeNull()
    expect(result.current.iphone).toBe(false)
  })

  it('an iPhone browser gets the hint', () => {
    stubEnv(IPHONE, false)
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.iphone).toBe(true)
  })

  it('works where matchMedia does not exist', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP)
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.iphone).toBe(false)
    expect(result.current.install).toBeNull()
  })
})
