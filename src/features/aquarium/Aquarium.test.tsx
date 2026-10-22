import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { FishId } from '@/features/fish/catalog'
import { Aquarium, useAquarium } from './Aquarium'
import { TUBE_STYLE_KEY } from './tubeStyle'

const motionPrefs = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => motionPrefs.reduced,
}))

function Tube({ fish, ml, scaleMl = 3000 }: { fish: FishId; ml: number; scaleMl?: number }) {
  const aquarium = useAquarium(fish, ml, scaleMl)
  return aquarium ? <Aquarium {...aquarium} /> : null
}

const pieces = (root: ParentNode) => [...root.querySelectorAll('[data-piece]')].map((el) => el.getAttribute('data-piece'))
const styleText = (root: ParentNode) => [...root.querySelectorAll('style')].map((s) => s.textContent ?? '').join('')

afterEach(() => {
  motionPrefs.reduced = false
  localStorage.clear()
})

describe('Aquarium', () => {
  it('draws the river for a freshwater fish', () => {
    const { container } = render(<Tube fish="betta" ml={3000} />)
    expect(container.querySelector('[data-aquarium="fresh"]')).not.toBeNull()
    expect(pieces(container)).toContain('log')
  })

  it('draws the reef for a saltwater fish', () => {
    const { container } = render(<Tube fish="clownfish" ml={3000} />)
    expect(container.querySelector('[data-aquarium="salt"]')).not.toBeNull()
    expect(pieces(container)).toContain('anchor')
  })

  it('is plain water at 0,5 L: no piece and no bubble', () => {
    const { container } = render(<Tube fish="betta" ml={500} />)
    expect(pieces(container)).toEqual([])
    expect(container.querySelector('.aq-bubble')).toBeNull()
  })

  it('lets the bubbles rise in a full tube', () => {
    const { container } = render(<Tube fish="betta" ml={3000} />)
    expect(container.querySelectorAll('.aq-bubble').length).toBeGreaterThan(0)
  })

  it('keeps the school away until the water covers it', () => {
    // 3 L on a 5 L day: the surface sits at 86 px, under the school's top edge (55 px)
    const { container } = render(<Tube fish="betta" ml={3000} scaleMl={5000} />)
    expect(pieces(container)).toContain('bed')
    expect(pieces(container)).not.toContain('school')
  })

  it('draws the roots in the air above the water as well as under it', () => {
    const { container } = render(<Tube fish="betta" ml={2000} />)
    expect(pieces(container).filter((p) => p === 'roots')).toHaveLength(2)
  })

  it('fades nothing in when Hoje opens', () => {
    const { container } = render(<Tube fish="betta" ml={3000} />)
    expect(styleText(container)).not.toContain('aq-fade')
  })

  it('fades in only the pieces a drink brings', () => {
    const { container, rerender } = render(<Tube fish="betta" ml={1500} />)
    rerender(<Tube fish="betta" ml={2000} />)
    const css = styleText(container)
    expect(css).toContain('aq-fade 400ms ease-out')
    expect(css).toContain('[data-piece="shrimp"]')
    expect(css).not.toContain('[data-piece="bed"]')
  })

  it('under reduced motion shows the scene still: no bubbles, no fade', () => {
    motionPrefs.reduced = true
    const { container, rerender } = render(<Tube fish="betta" ml={1500} />)
    rerender(<Tube fish="betta" ml={2000} />)
    expect(pieces(container)).toContain('shrimp')
    expect(container.querySelector('.aq-bubble')).toBeNull()
    expect(styleText(container)).not.toContain('aq-fade')
  })

  it('never replays a fade once reduced motion is on', () => {
    const { container, rerender } = render(<Tube fish="betta" ml={1500} />)
    rerender(<Tube fish="betta" ml={2000} />)
    expect(styleText(container)).toContain('aq-fade')
    motionPrefs.reduced = true
    rerender(<Tube fish="betta" ml={2000} />)
    expect(styleText(container)).not.toContain('aq-fade')
  })

  it('draws nothing under Só água', () => {
    localStorage.setItem(TUBE_STYLE_KEY, 'agua')
    const { container } = render(<Tube fish="betta" ml={3000} />)
    expect(container.querySelector('[data-aquarium]')).toBeNull()
    expect(container.querySelector('style')).toBeNull()
  })
})
