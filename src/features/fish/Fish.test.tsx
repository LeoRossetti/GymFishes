import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { FISH_IDS, fishOf } from './catalog'
import { Fish } from './Fish'
import { ART } from './svg'

describe('Fish', () => {
  it('has art for all thirteen fish', () => {
    for (const id of FISH_IDS) {
      expect(ART[id].body, id).toMatch(/^M/)
      expect(ART[id].tail.length, id).toBeGreaterThan(0)
      expect(ART[id].layers.length, id).toBeGreaterThan(0)
      expect(ART[id].eyes.length, id).toBeGreaterThan(0)
    }
  })

  it('every fish is drawn inside the 160×100 box', () => {
    for (const id of FISH_IDS) {
      const all = [ART[id].body, ...ART[id].tail.map((l) => l.d), ...ART[id].layers.map((l) => l.d)].join(' ')
      for (const m of all.matchAll(/-?\d+(\.\d+)?/g)) {
        expect(Number(m[0]), `${id}: ${m[0]}`).toBeGreaterThanOrEqual(-8)
        expect(Number(m[0]), `${id}: ${m[0]}`).toBeLessThanOrEqual(166)
      }
    }
  })

  it('renders every variant as an svg sized from the width', () => {
    for (const id of FISH_IDS) {
      const { container, unmount } = render(<Fish variant={id} size={64} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('data-fish', id)
      expect(svg).toHaveAttribute('width', '64')
      expect(svg).toHaveAttribute('height', '40')
      unmount()
    }
  })

  it('idle wags the tail and bobs; still does neither', () => {
    const idle = render(<Fish variant="betta" state="idle" />)
    expect(idle.container.querySelector('.fish-tail')).not.toBeNull()
    expect(idle.container.querySelector('.fish-bob')).not.toBeNull()
    idle.unmount()
    const still = render(<Fish variant="betta" state="still" />)
    expect(still.container.querySelector('.fish-tail')).toBeNull()
    expect(still.container.querySelector('.fish-bob')).toBeNull()
  })

  it('locked is a silhouette with no outline', () => {
    const { container } = render(<Fish variant="shark" state="locked" />)
    expect(container.querySelector('svg')).toHaveClass('fish-locked')
    expect(container.querySelector('.fish-tail')).toBeNull()
  })

  it('clips shaded layers to the body', () => {
    const { container } = render(<Fish variant="betta" />)
    const clip = container.querySelector('clipPath')
    expect(clip).not.toBeNull()
    expect(clip?.querySelector('path')).toHaveAttribute('d', ART.betta.body)
  })

  it('renders an old profile value the catalog dropped as the default fish', () => {
    const { container } = render(<Fish variant={fishOf('angelfish')} />)
    expect(container.querySelector('svg')).toHaveAttribute('data-fish', 'guppy')
  })

  it('every fish renders in every state (spec M7 §11)', () => {
    for (const id of FISH_IDS) {
      for (const state of ['idle', 'still', 'locked'] as const) {
        const { container, unmount } = render(<Fish variant={id} state={state} />)
        expect(container.querySelector('svg'), `${id} ${state}`).toHaveAttribute('data-state', state)
        expect(container.querySelectorAll('path').length, `${id} ${state}`).toBeGreaterThan(1)
        unmount()
      }
    }
  })
})
