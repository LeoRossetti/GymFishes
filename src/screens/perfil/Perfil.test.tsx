import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Perfil } from './Perfil'

const updateProfile = vi.fn()
const signOut = vi.fn()

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({
    data: {
      profile: { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue' },
      groupId: 'g1',
    },
  }),
}))
vi.mock('@/features/profile/mutations', () => ({
  updateProfile: (...args: unknown[]) => updateProfile(...args),
}))
vi.mock('@/features/group/queries', () => ({
  useGroup: () => ({ data: { id: 'g1', name: 'Casa', invite_code: 'ABC234' } }),
  useMembers: () => ({
    data: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
  }),
}))
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: (...args: unknown[]) => signOut(...args) } },
}))
vi.mock('@/features/bottles/queries', () => ({ useBottles: () => ({ data: [] }) }))
vi.mock('@/features/bottles/mutations', () => ({
  createBottle: vi.fn(),
  updateBottle: vi.fn(),
  archiveBottle: vi.fn(),
}))
const syncStatus = vi.hoisted(() => ({ offline: false, stale: false }))
vi.mock('@/features/entries/queries', () => ({
  useEntries: () => ({ data: [] }),
  useSyncStatus: () => ({ ...syncStatus }),
}))

describe('Perfil', () => {
  beforeEach(() => {
    updateProfile.mockReset().mockResolvedValue(undefined)
    signOut.mockReset().mockResolvedValue({ error: null })
    syncStatus.offline = false
    syncStatus.stale = false
  })

  it('shows group name, invite code and members', () => {
    renderWithProviders(<Perfil />)
    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.getByText('ABC234')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('saves an edited name', async () => {
    renderWithProviders(<Perfil />)
    const field = screen.getByLabelText('Nome')
    await userEvent.clear(field)
    await userEvent.type(field, 'Leonardo')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { display_name: 'Leonardo' })
  })

  it('changes the accent color', async () => {
    renderWithProviders(<Perfil />)
    await userEvent.click(screen.getByRole('button', { name: 'Rosa' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { accent: 'pink' })
  })

  it('shows an error when saving the name fails', async () => {
    updateProfile.mockRejectedValueOnce(new Error('down'))
    renderWithProviders(<Perfil />)
    const field = screen.getByLabelText('Nome')
    await userEvent.clear(field)
    await userEvent.type(field, 'Leonardo')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
  })

  it('says why the name cannot be saved yet', async () => {
    renderWithProviders(<Perfil />)
    const field = screen.getByLabelText('Nome')
    await userEvent.clear(field)
    await userEvent.type(field, 'L')
    expect(screen.getByText('Use pelo menos 2 caracteres')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar' })).not.toBeInTheDocument()
  })

  it('shows the offline pill in the header', () => {
    syncStatus.offline = true
    renderWithProviders(<Perfil />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
  })

  it('hides the copy button when the clipboard API is unavailable', () => {
    renderWithProviders(<Perfil />)
    expect(screen.queryByRole('button', { name: 'Copiar código' })).not.toBeInTheDocument()
  })

  it('signs out only on the second tap', async () => {
    renderWithProviders(<Perfil />)
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(signOut).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Sair mesmo?' }))
    expect(signOut).toHaveBeenCalled()
  })

  it('shows your fish and opens the gallery in place', async () => {
    renderWithProviders(<Perfil />)
    expect(screen.getByText('Guppy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Baiacu' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
    expect(screen.getByRole('button', { name: 'Baiacu' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Sequência de 7 dias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guppy' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('picking an unlocked fish saves it', async () => {
    renderWithProviders(<Perfil />)
    await userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Betta' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { fish_variant: 'betta' })
  })

  it('shows the app version and build date under Sair', () => {
    renderWithProviders(<Perfil />)
    expect(screen.getByText(/^Versão \d+\.\d+\.\d+ · \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument()
  })
})
