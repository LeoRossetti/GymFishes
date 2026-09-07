import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Outlet, Route, Routes } from 'react-router'
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
vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), retry: vi.fn() }),
}))
vi.mock('@/features/entries/outboxStore', () => ({
  useOutboxStatus: () => ({ pending: new Set(), failed: new Set(), queued: new Set() }),
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
  useSyncStatus: () => ({ offline: false, stale: false }),
}))

function renderHoje() {
  return renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ openRegister: vi.fn() }} />}>
        <Route path="/" element={<Hoje />} />
      </Route>
    </Routes>,
  )
}

describe('Hoje', () => {
  it('shows both tubes with totals and labels', () => {
    renderHoje()
    // each total shows twice: once on the tube, once on today's register row
    expect(screen.getAllByText('1,8 L')).toHaveLength(2)
    expect(screen.getAllByText('2,3 L')).toHaveLength(2)
    expect(screen.getByText('Você')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })
  it('shows the gap line', () => {
    renderHoje()
    expect(screen.getByText('Ana está 500 ml na frente')).toBeInTheDocument()
  })
  it('shows the registers header with the count', () => {
    renderHoje()
    expect(screen.getByText('Registros de hoje · 2')).toBeInTheDocument()
  })
  it('shows a partner row with their name', () => {
    renderHoje()
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument()
  })
})
