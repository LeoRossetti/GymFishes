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
    expect(shark).toBeDisabled()
    expect(shark).toHaveTextContent('Ganhar 1 mês')
    expect(shark.querySelector('svg')).toHaveAttribute('data-state', 'locked')
    expect(screen.getByRole('button', { name: 'Baiacu' })).toBeEnabled()
  })

  it('picking an unlocked fish reports its id', async () => {
    const onSelect = vi.fn()
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Baiacu' }))
    expect(onSelect).toHaveBeenCalledWith('pufferfish')
  })
})
