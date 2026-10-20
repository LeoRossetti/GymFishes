import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CelebrationScreen } from './CelebrationScreen'

describe('CelebrationScreen', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
  afterEach(() => vi.useRealTimers())

  it('announces a record and auto-dismisses after 4 seconds', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'record', ml: 4200 }} onClose={onClose} onChoose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Novo recorde! 4,2 L' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3999))
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('is a modal dialog that takes focus on mount and announces itself for screen readers', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'record', ml: 4200 }} onClose={onClose} onChoose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Novo recorde! 4,2 L' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Novo recorde! 4,2 L')
  })

  it('dismisses on tap', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'streak', days: 30 }} onClose={onClose} onChoose={vi.fn()} />)
    // the text shows both on screen and in the hidden status announcement — assert on count, not uniqueness
    expect(screen.getAllByText('🔥 30 dias seguidos!')).toHaveLength(2)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('the unlock screen names the achievement, shows the fish, waits for a choice, and reports it', () => {
    const onClose = vi.fn()
    const onChoose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} onClose={onClose} onChoose={onChoose} />)
    expect(screen.getByText(/Registre com uma garrafa/)).toHaveTextContent('Conquista: Registre com uma garrafa')
    expect(screen.getByText('Novo peixe!')).toBeInTheDocument()
    expect(screen.getByText('Baiacu')).toBeInTheDocument()
    expect(document.querySelector('svg[data-fish="pufferfish"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher agora' }))
    expect(onChoose).toHaveBeenCalledWith('pufferfish')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Depois just closes', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'shark' }} onClose={onClose} onChoose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Depois' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('the unlock screen shows the lead trophy when the register also took the lead', () => {
    render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} lead onClose={vi.fn()} onChoose={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Você está na frente' })).toBeInTheDocument()
  })

  it('record and streak screens never show the trophy, and unlock without lead has none', () => {
    const { rerender } = render(<CelebrationScreen celebration={{ kind: 'record', ml: 4200 }} lead onClose={vi.fn()} onChoose={vi.fn()} />)
    expect(screen.queryByRole('img', { name: 'Você está na frente' })).toBeNull()
    rerender(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} onClose={vi.fn()} onChoose={vi.fn()} />)
    expect(screen.queryByRole('img', { name: 'Você está na frente' })).toBeNull()
  })
})
