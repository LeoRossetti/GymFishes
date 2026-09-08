import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { DayDetail } from './DayDetail'

vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), retry: vi.fn() }),
}))
vi.mock('@/features/entries/outboxStore', () => ({
  useOutboxStatus: () => ({ pending: new Set(), failed: new Set(), queued: new Set() }),
}))

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
]

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) =>
  ({
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
  }) as Entry

const entries = [row('e1', 'u1', 1800, '2026-08-10'), row('e2', 'u2', 2300, '2026-08-10'), row('e3', 'u1', 3000, '2026-08-03')]

describe('DayDetail', () => {
  it('shows the day, both totals and that day rows only', () => {
    renderWithProviders(
      <DayDetail day="2026-08-10" userId="u1" groupId="g1" members={members} entries={entries} openRegister={vi.fn()} />,
    )
    expect(screen.getByText('segunda, 10 de agosto')).toBeInTheDocument()
    expect(screen.getByText('Você 1,8 L · Ana 2,3 L')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument()
  })

  it('shows the empty text on a day without registers', () => {
    renderWithProviders(
      <DayDetail day="2026-08-05" userId="u1" groupId="g1" members={members} entries={entries} openRegister={vi.fn()} />,
    )
    expect(screen.getByText('Você 0 ml · Ana 0 ml')).toBeInTheDocument()
    expect(screen.getByText('Nenhum registro neste dia')).toBeInTheDocument()
  })
})
