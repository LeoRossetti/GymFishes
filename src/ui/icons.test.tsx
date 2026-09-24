import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Calendar, Camera, Check, Clock, Close, Drop, FishIcon, Flame, Note, Plus, Trophy } from './icons'

const ALL = { Drop, Trophy, Calendar, FishIcon, Plus, Flame, Camera, Note, Clock, Check, Close }

describe('icons', () => {
  it('every icon is a hidden svg sized by the size prop, drawn in currentColor', () => {
    for (const [name, Icon] of Object.entries(ALL)) {
      const { container, unmount } = render(<Icon size={18} />)
      const svg = container.querySelector('svg')
      expect(svg, name).toHaveAttribute('aria-hidden', 'true')
      expect(svg, name).toHaveAttribute('width', '18')
      expect(svg, name).toHaveAttribute('height', '18')
      expect(svg, name).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg?.getAttribute('data-icon'), name).toBeTruthy()
      unmount()
    }
  })

  it('defaults to 24px', () => {
    const { container } = render(<Drop />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '24')
  })

  it('filled fills the drop, an outline leaves it hollow', () => {
    const hollow = render(<Drop />)
    expect(hollow.container.querySelector('path')).toHaveAttribute('fill', 'none')
    hollow.unmount()
    const solid = render(<Drop filled />)
    expect(solid.container.querySelector('path')).toHaveAttribute('fill', 'currentColor')
  })

  it('the flame is always solid', () => {
    const { container } = render(<Flame />)
    expect(container.querySelector('path')).toHaveAttribute('fill', 'currentColor')
  })

  it('passes stroke width through for heavier active states', () => {
    const { container } = render(<Plus strokeWidth={2.6} />)
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2.6')
  })
})
