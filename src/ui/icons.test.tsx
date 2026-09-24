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

  it('filled and hollow behavior for Drop, Trophy, Calendar, FishIcon', () => {
    // Drop: first path's fill toggles
    const dropHollow = render(<Drop />)
    expect(dropHollow.container.querySelector('path')).toHaveAttribute('fill', 'none')
    dropHollow.unmount()
    const dropSolid = render(<Drop filled />)
    expect(dropSolid.container.querySelector('path')).toHaveAttribute('fill', 'currentColor')
    dropSolid.unmount()

    // Trophy: first path (cup) fill toggles
    const trophyHollow = render(<Trophy />)
    expect(trophyHollow.container.querySelector('path')).toHaveAttribute('fill', 'none')
    trophyHollow.unmount()
    const trophySolid = render(<Trophy filled />)
    expect(trophySolid.container.querySelector('path')).toHaveAttribute('fill', 'currentColor')
    trophySolid.unmount()

    // Calendar: filled state adds a path with fill="currentColor"
    const calendarHollow = render(<Calendar />)
    expect(calendarHollow.container.querySelector('path[fill="currentColor"]')).toBeNull()
    calendarHollow.unmount()
    const calendarSolid = render(<Calendar filled />)
    expect(calendarSolid.container.querySelector('path[fill="currentColor"]')).toBeTruthy()
    calendarSolid.unmount()

    // FishIcon: first two paths and circle fill toggle
    const fishHollow = render(<FishIcon />)
    const fishHollowPaths = fishHollow.container.querySelectorAll('path')
    expect(fishHollowPaths[0]).toHaveAttribute('fill', 'none')
    expect(fishHollowPaths[1]).toHaveAttribute('fill', 'none')
    expect(fishHollow.container.querySelector('circle')).toHaveAttribute('fill', 'currentColor')
    fishHollow.unmount()
    const fishSolid = render(<FishIcon filled />)
    const fishSolidPaths = fishSolid.container.querySelectorAll('path')
    expect(fishSolidPaths[0]).toHaveAttribute('fill', 'currentColor')
    expect(fishSolidPaths[1]).toHaveAttribute('fill', 'currentColor')
    expect(fishSolid.container.querySelector('circle')).toHaveAttribute('fill', 'var(--color-bg)')
    fishSolid.unmount()
  })

  it('stroke-only icons ignore the filled prop', () => {
    const strokeIcons = [Plus, Camera, Note, Clock, Check, Close]
    for (const Icon of strokeIcons) {
      const hollow = render(<Icon />)
      const solid = render(<Icon filled />)
      expect(hollow.container.innerHTML).toBe(solid.container.innerHTML)
      expect(solid.container.querySelector('svg')).not.toHaveAttribute('filled')
      hollow.unmount()
      solid.unmount()
    }
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
