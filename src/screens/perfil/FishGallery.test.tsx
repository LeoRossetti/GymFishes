import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UnlockEntry } from '@/features/fish/unlocks'
import { addDays, dayKey } from '@/lib/dates'
import { FishGallery } from './FishGallery'

const group = vi.hoisted(() => ({ entries: [] as UnlockEntry[] }))
vi.mock('@/features/group/useGroupData', () => ({ useGroupData: () => ({ entries: group.entries }) }))

afterEach(() => {
  group.entries = []
})

function open(current: string) {
  render(<FishGallery userId="u1" current={current} busy={false} onSelect={vi.fn()} />)
  return userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
}

describe('FishGallery', () => {
  it('shows the collection count inside the open gallery only', async () => {
    render(<FishGallery userId="u1" current="guppy" busy={false} onSelect={vi.fn()} />)
    expect(screen.queryByText(/de 18 peixes/)).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
    expect(screen.getByText('4 de 18 peixes')).toBeInTheDocument()
  })

  it('counts the worn fish as owned, even one the catalog dropped', async () => {
    await open('dolphin')
    expect(screen.getByText('5 de 18 peixes')).toBeInTheDocument()
  })

  it('shows how far each locked fish is', async () => {
    await open('guppy')
    expect(screen.getByRole('button', { name: 'Pirarucu' })).toHaveTextContent('0 de 30')
    expect(screen.getByRole('button', { name: 'Tubarão' })).toHaveTextContent('0 de 200')
  })

  it('a member on a 12-day run sees 12 de 30 under the pirarucu', async () => {
    const today = dayKey(new Date())
    group.entries = Array.from({ length: 12 }, (_, i) => ({
      profile_id: 'u1',
      total_ml: 500,
      drank_on: addDays(today, -i),
      deleted_at: null,
    }))
    await open('guppy')
    expect(screen.getByRole('button', { name: 'Pirarucu' })).toHaveTextContent('12 de 30')
  })
})
