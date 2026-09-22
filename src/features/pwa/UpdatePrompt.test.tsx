import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdatePrompt } from './UpdatePrompt'

describe('UpdatePrompt', () => {
  it('renders nothing while the build is current', () => {
    const apply = vi.fn<() => Promise<void>>(() => Promise.resolve())
    render(<UpdatePrompt ready={false} apply={apply} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('announces the new build and applies it on tap', async () => {
    const apply = vi.fn<() => Promise<void>>(() => Promise.resolve())
    render(<UpdatePrompt ready apply={apply} />)
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível')
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(apply).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Atualizando…' })).toHaveAttribute('aria-busy', 'true')
  })

  it('recovers the button when applying the update fails', async () => {
    const apply = vi.fn<() => Promise<void>>(() => Promise.resolve())
    apply.mockRejectedValueOnce(new Error('falhou'))
    render(<UpdatePrompt ready apply={apply} />)
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    const button = await screen.findByRole('button', { name: 'Atualizar' })
    expect(button).not.toHaveAttribute('aria-busy')
  })
})
