import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast'

const motionPrefs = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => motionPrefs.reduced,
}))

function Trigger() {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast('Registro salvo')}>
      Avisar
    </button>
  )
}

function showToast() {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))
  return screen.getByRole('status')
}

describe('ToastProvider', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
  afterEach(() => {
    vi.useRealTimers()
    motionPrefs.reduced = false
  })

  it('announces the message and lets it go after 4 s', async () => {
    expect(showToast()).toHaveTextContent('Registro salvo')
    act(() => vi.advanceTimersByTime(3999))
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    vi.useRealTimers() // the exit fade runs on real frames
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  })

  it('a second message restarts the 4 s', () => {
    showToast()
    act(() => vi.advanceTimersByTime(3000))
    fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))
    act(() => vi.advanceTimersByTime(3999))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('rises 8 px into place', () => {
    expect(showToast().style.transform).toContain('translateY(8px)')
  })

  it('under reduced motion it only fades, with no movement', () => {
    motionPrefs.reduced = true
    const toast = showToast()
    expect(toast.style.opacity).toBe('0')
    expect(toast.style.transform).not.toContain('translateY')
  })
})
