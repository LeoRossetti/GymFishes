import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet, Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import { Historico } from './Historico'

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

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) => ({
  id,
  profile_id,
  group_id: 'g1',
  total_ml,
  composition: [],
  note: null,
  photo_path: null,
  thumb_path: null,
  drank_at: `${drank_on}T15:00:00+00:00`,
  drank_on,
  created_at: `${drank_on}T15:00:00+00:00`,
  updated_at: `${drank_on}T15:00:00+00:00`,
  deleted_at: null,
})
vi.mock('@/features/entries/queries', () => ({
  useEntries: () => ({
    data: [
      row('e1', 'u1', 1800, '2026-08-10'),
      row('e2', 'u2', 2300, '2026-08-10'),
      row('e3', 'u1', 3000, '2026-08-03'),
      row('e4', 'u2', 500, '2026-07-15'),
    ],
  }),
}))

function renderHistorico() {
  return renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ openRegister: vi.fn() }} />}>
        <Route path="/" element={<Historico />} />
      </Route>
    </Routes>,
  )
}

describe('Historico', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-10T15:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('opens on your own current month with the footer', () => {
    renderHistorico()
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Você', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Agosto', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Agosto: 4,8 L · média 480 ml/dia · 2 de 10 dias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
  })

  it('switches to the partner', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'Ana' }))
    expect(screen.getByText('Agosto: 2,3 L · média 230 ml/dia · 1 de 10 dias')).toBeInTheDocument()
  })

  it('opens a day detail with both totals and the rows', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 10 de agosto' }))
    expect(screen.getByText('Você 1,8 L · Ana 2,3 L')).toBeInTheDocument()
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument()
  })

  it('steps back a month and clears the selected day', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 3 de agosto' }))
    expect(screen.getByText('Você 3 L · Ana 0 ml')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('Julho', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByText('Você 3 L · Ana 0 ml')).toBeNull()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled()
  })
})
