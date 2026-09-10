import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { FISH_IDS } from './catalog'
import { Fish } from './Fish'
import { ART } from './svg'

describe('Fish', () => {
  it('has art for all thirteen fish', () => {
    for (const id of FISH_IDS) {
      expect(ART[id].body, id).toMatch(/^M/)
      expect(ART[id].tail, id).toMatch(/^M/)
      expect(ART[id].eyes.length, id).toBeGreaterThan(0)
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

  it('locked is a silhouette', () => {
    const { container } = render(<Fish variant="shark" state="locked" />)
    expect(container.querySelector('svg')).toHaveClass('fish-locked')
    expect(container.querySelector('.fish-tail')).toBeNull()
  })
})
