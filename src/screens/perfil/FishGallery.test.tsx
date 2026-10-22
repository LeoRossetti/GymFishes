import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FishGallery } from './FishGallery'

vi.mock('@/features/group/useGroupData', () => ({ useGroupData: () => ({ entries: [] }) }))

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
})
