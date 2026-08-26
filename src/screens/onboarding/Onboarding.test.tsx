import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

const createProfile = vi.fn()
const createGroup = vi.fn()
const joinGroup = vi.fn()

vi.mock('@/features/profile/mutations', () => ({
  createProfile: (...a: unknown[]) => createProfile(...a),
}))
vi.mock('@/features/group/mutations', () => ({
  createGroup: (...a: unknown[]) => createGroup(...a),
  joinGroup: (...a: unknown[]) => joinGroup(...a),
}))
vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}))

describe('Onboarding', () => {
  beforeEach(() => {
    createProfile.mockReset().mockResolvedValue(undefined)
    createGroup.mockReset().mockResolvedValue({ id: 'group-1', inviteCode: 'ABC234' })
    joinGroup.mockReset().mockResolvedValue('group-1')
  })

  it('rejects a name shorter than two characters', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'L')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText('Use pelo menos 2 caracteres')).toBeInTheDocument()
    expect(createProfile).not.toHaveBeenCalled()
  })

  it('creates the profile then offers both group options', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(createProfile).toHaveBeenCalledWith('user-1', 'Leo')
    expect(await screen.findByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar com código' })).toBeInTheDocument()
  })

  it('creates a group, shows the invite code, then finishes on Continuar', async () => {
    const onDone = vi.fn()
    render(<Onboarding onDone={onDone} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Criar grupo' }))
    await userEvent.type(screen.getByLabelText('Nome do grupo'), 'Fitness Fishes')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(createGroup).toHaveBeenCalledWith('Fitness Fishes', 'user-1')
    expect(await screen.findByText('ABC234')).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onDone).toHaveBeenCalled()
  })

  it('joins with a code and finishes', async () => {
    const onDone = vi.fn()
    render(<Onboarding onDone={onDone} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ABC234')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(joinGroup).toHaveBeenCalledWith('ABC234')
    expect(onDone).toHaveBeenCalled()
  })

  it('shows a pt-BR error for an invalid code', async () => {
    joinGroup.mockRejectedValue(new Error('invalid_code'))
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ZZZZZZ')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('Código inválido')).toBeInTheDocument()
  })
})
