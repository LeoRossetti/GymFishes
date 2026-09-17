import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { SignUp } from './SignUp'

const signUp = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signUp: (...args: unknown[]) => signUp(...args) } },
}))

describe('SignUp', () => {
  beforeEach(() => {
    signUp.mockReset()
    signUp.mockResolvedValue({ data: { session: { access_token: 'x' }, user: { id: 'u1' } }, error: null })
  })

  it('shows a validation error and does not call Supabase', async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@')
    await userEvent.type(screen.getByLabelText('Senha'), 'curta')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('signs up with valid credentials', async () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(signUp).toHaveBeenCalledWith({ email: 'leo@exemplo.com', password: 'senhaforte1' })
  })

  it('shows a generic pt-BR message when Supabase rejects the sign-up', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: null }, error: { message: 'boom' } })
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
  })

  it('shows the confirmation message when sign-up succeeds without a session', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { id: 'u1' } }, error: null })
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Confira seu e-mail para confirmar a conta.')).toBeInTheDocument()
  })

  it('shows a busy state while the sign-up request is pending', async () => {
    let resolveSignUp!: (value: { data: { session: null; user: null }; error: null }) => void
    signUp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve
        }),
    )
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    )
    await userEvent.type(screen.getByLabelText('E-mail'), 'leo@exemplo.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senhaforte1')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    const button = await screen.findByRole('button', { name: 'Criando conta…' })
    expect(button).toHaveAttribute('aria-busy', 'true')

    resolveSignUp({ data: { session: null, user: null }, error: null })
  })
})
