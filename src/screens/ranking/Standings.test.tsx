import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Member } from '@/features/group/queries'
import { Standings } from './Standings'

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
]

describe('Standings', () => {
  it('lists members in order with positions, names and totals', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u2', ml: 2300, position: 1, share: 1 },
          { profileId: 'u1', ml: 1800, position: 2, share: 0.78 },
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]!).getByText('1')).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('Ana')
    expect(items[0]).toHaveTextContent('2,3 L')
    expect(within(items[1]!).getByText('2')).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('Você')
    expect(items[1]).toHaveTextContent('1,8 L')
  })

  it('shows the empty state when nobody registered', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u1', ml: 0, position: 1, share: 0 },
          { profileId: 'u2', ml: 0, position: 1, share: 0 },
        ]}
      />,
    )
    expect(screen.getByText('Nada registrado neste período')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('gives both tied members the first position', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u1', ml: 1000, position: 1, share: 1 },
          { profileId: 'u2', ml: 1000, position: 1, share: 1 },
        ]}
      />,
    )
    expect(screen.getAllByText('1')).toHaveLength(2)
  })
})
