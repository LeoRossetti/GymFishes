import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

const createProfile = vi.fn()
const updateProfile = vi.fn()
const createGroup = vi.fn()
const joinGroup = vi.fn()

vi.mock('@/features/profile/mutations', () => ({
  createProfile: (...a: unknown[]) => createProfile(...a),
  updateProfile: (...a: unknown[]) => updateProfile(...a),
}))
vi.mock('@/features/group/mutations', () => ({
  createGroup: (...a: unknown[]) => createGroup(...a),
  joinGroup: (...a: unknown[]) => joinGroup(...a),
}))
vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}))

/** Name → fish: the two steps every later flow has to pass. */
async function throughNameAndFish(fish = 'Guppy') {
  await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await userEvent.click(await screen.findByRole('button', { name: fish }))
}

describe('Onboarding', () => {
  beforeEach(() => {
    createProfile.mockReset().mockResolvedValue(undefined)
    updateProfile.mockReset().mockResolvedValue(undefined)
    createGroup.mockReset().mockResolvedValue({ id: 'group-1', inviteCode: 'ABC234' })
    joinGroup.mockReset().mockResolvedValue('group-1')
  })
  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('rejects a name shorter than two characters', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'L')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Use pelo menos 2 caracteres')).toBeInTheDocument()
    expect(createProfile).not.toHaveBeenCalled()
  })

  it('creates the profile then offers the four starter fish', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(createProfile).toHaveBeenCalledWith('user-1', 'Leo')
    expect(await screen.findByText('Escolha seu peixe')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Peixe-dourado' })).toBeEnabled()
  })

  it('picking a fish saves it and offers both group options', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish('Betta')
    expect(updateProfile).toHaveBeenCalledWith('user-1', { fish_variant: 'betta' })
    expect(await screen.findByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar com código' })).toBeInTheDocument()
  })

  it('creates a group, shows the invite code, then finishes on Continuar', async () => {
    const onDone = vi.fn()
    render(<Onboarding onDone={onDone} />)
    await throughNameAndFish()
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
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ABC234')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(joinGroup).toHaveBeenCalledWith('ABC234')
    expect(onDone).toHaveBeenCalled()
  })

  it('shows a pt-BR error for an invalid code', async () => {
    joinGroup.mockRejectedValue(new Error('invalid_code'))
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ZZZZZZ')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Código inválido')).toBeInTheDocument()
  })

  it('stays on the fish step with an error when saving the fish fails', async () => {
    updateProfile.mockRejectedValueOnce(new Error('down'))
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    expect(await screen.findByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
    expect(screen.getByText('Escolha seu peixe')).toBeInTheDocument()
  })

  it('shows Voltar on Criar grupo and Entrar com código', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Criar grupo' }))
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('goes back to the group choice from Entrar com código', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
  })

  it('does not render the invite-code copy button when clipboard is unavailable', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Criar grupo' }))
    await userEvent.type(screen.getByLabelText('Nome do grupo'), 'Fitness Fishes')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('ABC234')
    expect(screen.queryByRole('button', { name: 'Copiar código' })).not.toBeInTheDocument()
  })

  it('shows Copiado only once copying the invite code resolves, then reverts after 2s', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Criar grupo' }))
    await userEvent.type(screen.getByLabelText('Nome do grupo'), 'Fitness Fishes')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByText('ABC234')

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const button = screen.getByRole('button', { name: 'Copiar código' })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(writeText).toHaveBeenCalledWith('ABC234')
    expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument()
  })
})
