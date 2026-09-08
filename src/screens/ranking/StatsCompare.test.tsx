import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Member } from '@/features/group/queries'
import type { MemberStats } from '@/lib/averages'
import { StatsCompare } from './StatsCompare'

const members: Member[] = [
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '1' },
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '2' },
]

const mine: MemberStats = {
  totalMl: 21_600,
  averageMl: 2400,
  bestDay: { day: '2026-08-07', ml: 4200 },
  daysRegistered: 9,
  daysElapsed: 10,
  registers: 41,
}
const hers: MemberStats = {
  totalMl: 29_000,
  averageMl: 2900,
  bestDay: { day: '2026-08-02', ml: 3800 },
  daysRegistered: 10,
  daysElapsed: 10,
  registers: 58,
}

describe('StatsCompare', () => {
  it('shows one column per member, Você first, with every row', () => {
    render(<StatsCompare userId="u1" members={members} stats={new Map([['u1', mine], ['u2', hers]])} />)
    expect(screen.getByText('Médias e recordes')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Você', 'Ana'])
    expect(screen.getByText('Média por dia').closest('tr')).toHaveTextContent('2,4 L')
    expect(screen.getByText('Média por dia').closest('tr')).toHaveTextContent('2,9 L')
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('4,2 L (7 ago)')
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('3,8 L (2 ago)')
    expect(screen.getByText('Dias registrados').closest('tr')).toHaveTextContent('9 de 10')
    expect(screen.getByText('Registros').closest('tr')).toHaveTextContent('41')
    expect(screen.getByText('Registros').closest('tr')).toHaveTextContent('58')
  })

  it('shows a dash for a member with no best day', () => {
    render(<StatsCompare userId="u1" members={members} stats={new Map([['u1', mine]])} />)
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('—')
    expect(screen.getByText('Dias registrados').closest('tr')).toHaveTextContent('0 de 0')
  })
})
