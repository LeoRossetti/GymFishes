import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdatePrompt } from './UpdatePrompt'

const update = vi.hoisted(() => ({ ready: false, apply: vi.fn(() => Promise.resolve()) }))
vi.mock('@/features/pwa/registerSW', () => ({
  useAppUpdate: () => ({ ready: update.ready, apply: update.apply }),
}))

describe('UpdatePrompt', () => {
  it('renders nothing while the build is current', () => {
    update.ready = false
    render(<UpdatePrompt />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('announces the new build and applies it on tap', async () => {
    update.ready = true
    render(<UpdatePrompt />)
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível')
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(update.apply).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Atualizando…' })).toHaveAttribute('aria-busy', 'true')
  })
})
