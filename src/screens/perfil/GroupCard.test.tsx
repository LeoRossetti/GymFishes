import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { GroupCard } from './GroupCard'

vi.mock('@/features/group/queries', () => ({
  useGroup: () => ({ data: { id: 'g1', name: 'Casa', invite_code: 'ABC234' } }),
  useMembers: () => ({
    data: [{ id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' }],
  }),
}))

describe('GroupCard', () => {
  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('hides the copy button when the clipboard API is unavailable', () => {
    render(<GroupCard groupId="g1" />)
    expect(screen.queryByRole('button', { name: 'Copiar código' })).not.toBeInTheDocument()
  })

  it('shows Copiado only once copying resolves, then reverts to Copiar código after 2s', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<GroupCard groupId="g1" />)

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const button = screen.getByRole('button', { name: 'Copiar código' })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(writeText).toHaveBeenCalledWith('ABC234')
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1999))
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument()
  })
})
