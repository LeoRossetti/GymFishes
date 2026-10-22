import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FISH_IDS, type FishId } from './catalog'
import { FishGrid } from './FishGrid'

const unlocked: ReadonlySet<FishId> = new Set<FishId>(['guppy', 'betta', 'goldfish', 'neon', 'pufferfish'])

describe('FishGrid', () => {
  it('lists every fish by name, marking the selected one', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected="betta" onSelect={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(18)
    expect(screen.getByRole('button', { name: 'Betta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Guppy' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('locked fish are silhouettes with their condition and cannot be picked', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    const shark = screen.getByRole('button', { name: 'Tubarão' })
    expect(shark).toHaveAttribute('aria-disabled', 'true')
    expect(shark).toHaveTextContent('200 L acumulados')
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

  it('the 7-day fish is the tucunaré; the fish M10 dropped are gone', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tucunaré' })).toHaveTextContent('Sequência de 7 dias')
    for (const name of ['Peixe-anjo', 'Polvo', 'Cavalo-marinho', 'Tartaruga', 'Golfinho']) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
  })

  it('shows the fish large in two columns so the drawing can be seen (spec M7 §9.4)', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('list', { name: 'Galeria de peixes' })).toHaveClass('grid-cols-2')
    expect(screen.getByRole('button', { name: 'Guppy' }).querySelector('svg')).toHaveAttribute('width', '140')
  })

  describe('progress', () => {
    const progress = (id: FishId) =>
      id === 'pirarucu'
        ? { current: 12, target: 30 }
        : id === 'shark'
          ? { current: 84_500, target: 200_000 }
          : id === 'mahimahi'
            ? { current: 2800, target: 3500 }
            : id === 'pufferfish'
              ? { current: 5, target: 5 }
              : null

    function renderWithProgress() {
      render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} progress={progress} />)
    }

    it('a locked streak fish shows the run so far and a bar', () => {
      renderWithProgress()
      const card = screen.getByRole('button', { name: 'Pirarucu' })
      expect(card).toHaveTextContent('12 de 30')
      const bar = within(card).getByRole('progressbar', { name: 'Sequência de 30 dias' })
      expect(bar).toHaveAttribute('aria-valuenow', '12')
      expect(bar).toHaveAttribute('aria-valuemin', '0')
      expect(bar).toHaveAttribute('aria-valuemax', '30')
    })

    it('volume shows whole litres', () => {
      renderWithProgress()
      expect(screen.getByRole('button', { name: 'Tubarão' })).toHaveTextContent('84 de 200')
    })

    it('a record shows litres with one decimal comma', () => {
      renderWithProgress()
      expect(screen.getByRole('button', { name: 'Mahi-mahi' })).toHaveTextContent('2,8 de 3,5')
    })

    it('an unlocked fish shows no progress', () => {
      renderWithProgress()
      expect(within(screen.getByRole('button', { name: 'Baiacu' })).queryByRole('progressbar')).toBeNull()
    })

    it('without a progress prop (onboarding) nothing is shown', () => {
      render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
      expect(screen.queryByRole('progressbar')).toBeNull()
    })
  })
})
