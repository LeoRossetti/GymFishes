import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import { Ranking } from './Ranking'

const mirror = vi.hoisted(() => ({ entries: [] as unknown[] }))

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
  useEntries: () => ({ data: mirror.entries }),
}))

function renderRanking() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Ranking />} />
    </Routes>,
  )
}

describe('Ranking', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-10T15:00:00Z')) // segunda, 10 de agosto, meio-dia em São Paulo
    localStorage.clear()
    mirror.entries = [
      row('e1', 'u1', 1800, '2026-08-10'),
      row('e2', 'u2', 2300, '2026-08-10'),
      row('e3', 'u1', 3000, '2026-08-03'),
      row('e4', 'u2', 500, '2026-07-15'),
    ]
  })
  afterEach(() => vi.useRealTimers())

  it('ranks today by default with the leader first', () => {
    renderRanking()
    expect(screen.getByRole('heading', { name: 'Ranking' })).toBeInTheDocument()
    expect(screen.getByText('Hoje', { selector: 'p' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Ana')
    expect(items[0]).toHaveTextContent('2,3 L')
    expect(items[1]).toHaveTextContent('Você')
  })

  it('steps back to last week', async () => {
    renderRanking()
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
    expect(screen.getByText('Semana de 3–9 de agosto')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Você')
    expect(items[0]).toHaveTextContent('3 L')
  })

  it('shows all-time since the first register', async () => {
    renderRanking()
    await userEvent.click(screen.getByRole('button', { name: 'Total' }))
    expect(screen.getByText('Desde 15 de julho')).toBeInTheDocument()
  })

  it('shows the July wrap-up and the comparison card', () => {
    renderRanking()
    expect(screen.getByText('Julho encerrado — Ana venceu 🏆')).toBeInTheDocument()
    expect(screen.getByText('Médias e recordes')).toBeInTheDocument()
  })

  it('recomputes Total when the mirror hydrates after the tap', async () => {
    mirror.entries = []
    const { rerender, client } = renderRanking()
    await userEvent.click(screen.getByRole('button', { name: 'Total' }))
    expect(screen.getByText('Desde 10 de agosto')).toBeInTheDocument()
    expect(screen.getByText('Nada registrado neste período')).toBeInTheDocument()

    mirror.entries = [row('e4', 'u2', 500, '2026-07-15')]
    rerender(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Ranking />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Desde 15 de julho')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Ana')
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('500 ml')
  })
})
