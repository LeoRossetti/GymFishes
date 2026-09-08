import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { MonthWrapUp } from './MonthWrapUp'

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

const july = [row('e1', 'u1', 68_400, '2026-07-10'), row('e2', 'u2', 61_200, '2026-07-20')]
const today = '2026-08-10'

describe('MonthWrapUp', () => {
  beforeEach(() => localStorage.clear())

  it('announces last month winner and both totals', () => {
    render(<MonthWrapUp entries={july} members={members} userId="u2" today={today} />)
    expect(screen.getByText('Julho encerrado — Leo venceu 🏆')).toBeInTheDocument()
    expect(screen.getByText('68,4 L × 61,2 L')).toBeInTheDocument()
  })

  it('says Você when you won', () => {
    render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    expect(screen.getByText('Julho encerrado — Você venceu 🏆')).toBeInTheDocument()
  })

  it('says Empate on a tie', () => {
    const tie = [row('e1', 'u1', 1000, '2026-07-10'), row('e2', 'u2', 1000, '2026-07-20')]
    render(<MonthWrapUp entries={tie} members={members} userId="u1" today={today} />)
    expect(screen.getByText('Julho encerrado — Empate')).toBeInTheDocument()
  })

  it('hides after dismissal and stays hidden on the next mount', async () => {
    const first = render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByText(/Julho encerrado/)).toBeNull()
    expect(localStorage.getItem('gymfishes:wrapup:2026-07')).toBe('1')
    first.unmount()
    render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    expect(screen.queryByText(/Julho encerrado/)).toBeNull()
  })

  it('renders nothing when last month is empty', () => {
    const { container } = render(<MonthWrapUp entries={[]} members={members} userId="u1" today={today} />)
    expect(container).toBeEmptyDOMElement()
  })
})
