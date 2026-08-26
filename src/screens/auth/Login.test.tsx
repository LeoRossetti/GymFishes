import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Login } from './Login'

const signInWithPassword = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: (...args: unknown[]) => signInWithPassword(...args) } },
}))

describe('Login', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    signInWithPassword.mockResolvedValue({ error: null })
  })

  it('shows a validation error and does not call Supabase', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@')
    await userEvent.type(screen.getByLabelText('Senha'), 'curta')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('signs in with valid credentials', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'leo@exemplo.com',
      password: 'senhaforte1',
    })
  })

  it('shows a pt-BR message when Supabase rejects the credentials', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha incorretos')).toBeInTheDocument()
  })
})
