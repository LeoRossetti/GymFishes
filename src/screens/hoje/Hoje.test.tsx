import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { dayKey } from '@/lib/dates'
import { Hoje } from './Hoje'

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({ data: { profile: { id: 'u1' }, groupId: 'g1' } }),
}))
vi.mock('@/features/group/queries', () => ({
  useMembers: () => ({
    data: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
  }),
}))

const hoje = new Date().toISOString()
const hojeDia = dayKey(new Date())
vi.mock('@/features/entries/queries', () => ({
  useEntries: () => ({
    data: [
      { id: 'e1', profile_id: 'u1', group_id: 'g1', total_ml: 1800, composition: [], note: null, photo_path: null, thumb_path: null, drank_at: hoje, drank_on: hojeDia, created_at: hoje, updated_at: hoje, deleted_at: null },
      { id: 'e2', profile_id: 'u2', group_id: 'g1', total_ml: 2300, composition: [], note: null, photo_path: null, thumb_path: null, drank_at: hoje, drank_on: hojeDia, created_at: hoje, updated_at: hoje, deleted_at: null },
    ],
  }),
}))

describe('Hoje', () => {
  it('shows both tubes with totals and labels', () => {
    renderWithProviders(<Hoje />)
    expect(screen.getByText('1,8 L')).toBeInTheDocument()
    expect(screen.getByText('2,3 L')).toBeInTheDocument()
    expect(screen.getByText('Você')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })
  it('shows the gap line', () => {
    renderWithProviders(<Hoje />)
    expect(screen.getByText('Ana está 500 ml na frente')).toBeInTheDocument()
  })
})
