import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FISH_IDS, type FishId } from './catalog'
import { FishGrid } from './FishGrid'

const unlocked: ReadonlySet<FishId> = new Set<FishId>(['guppy', 'betta', 'goldfish', 'neon', 'pufferfish'])

describe('FishGrid', () => {
  it('lists every fish by name, marking the selected one', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected="betta" onSelect={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(13)
    expect(screen.getByRole('button', { name: 'Betta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Guppy' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('locked fish are silhouettes with their condition and cannot be picked', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    const shark = screen.getByRole('button', { name: 'Tubarão' })
    expect(shark).toHaveAttribute('aria-disabled', 'true')
    expect(shark).toHaveTextContent('50 registros')
    expect(shark.querySelector('svg')).toHaveAttribute('data-state', 'locked')
    expect(screen.getByRole('button', { name: 'Baiacu' })).toBeEnabled()
  })

  it('picking an unlocked fish reports its id', async () => {
    const onSelect = vi.fn()
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Baiacu' }))
    expect(onSelect).toHaveBeenCalledWith('pufferfish')
  })

  it('clicking a locked fish does not report a pick', async () => {
    const onSelect = vi.fn()
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Tubarão' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('the 7-day fish is the tambaqui; the angelfish is gone', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tambaqui' })).toHaveTextContent('Sequência de 7 dias')
    expect(screen.queryByRole('button', { name: 'Peixe-anjo' })).toBeNull()
  })

  it('shows the fish large in two columns so the drawing can be seen (spec M7 §9.4)', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Galeria de peixes' })).toHaveClass('grid-cols-2')
    expect(screen.getByRole('button', { name: 'Guppy' }).querySelector('svg')).toHaveAttribute('width', '140')
  })
})
