import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TUBE_STYLE_KEY } from '@/features/aquarium/tubeStyle'
import { MemberTube } from './MemberTube'

const base = { name: 'Ana', isSelf: false, accent: 'pink', fishVariant: 'betta', scaleMl: 3000 }
/** The tube's root: the only element that carries the mixed water as inline custom properties. */
const tubeRoot = (c: HTMLElement) => c.querySelector<HTMLElement>('[style*="--color-water"]')

afterEach(() => localStorage.clear())

describe('MemberTube', () => {
  it('shows the member fish once there is water', () => {
    const { container } = render(<MemberTube {...base} totalMl={1200} />)
    expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
  })

  it('draws no fish while the water is shallower than the fish', () => {
    const { container } = render(<MemberTube {...base} totalMl={250} />)
    expect(container.querySelector('svg[data-fish]')).toBeNull()
  })

  it('draws the fish as soon as the water covers it', () => {
    const { container } = render(<MemberTube {...base} totalMl={500} />)
    expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
  })

  it("measures the water in the tube's inner 216 px: 480 ml is still shallower than the fish", () => {
    // 480 / 3000 of 216 px is 34,6 px, under the fish's 35 px
    const { container } = render(<MemberTube {...base} totalMl={480} />)
    expect(container.querySelector('svg[data-fish]')).toBeNull()
  })

  it('lifts the fish in shallow water so its belly is not clipped', () => {
    // 500 ml fills 36 px of the inner 216: the 35 px fish sits 1 px under the crest
    const { container } = render(<MemberTube {...base} totalMl={500} />)
    const wrapper = container.querySelector('svg[data-fish]')?.parentElement
    expect(parseFloat(wrapper?.style.top ?? '')).toBeCloseTo(1, 5)
  })

  it('an empty tube has no fish', () => {
    const { container } = render(<MemberTube {...base} totalMl={0} />)
    expect(container.querySelector('svg[data-fish]')).toBeNull()
  })

  it('an empty tube draws no crest', () => {
    const { container } = render(<MemberTube {...base} totalMl={0} />)
    expect(container.querySelector('.wave-front, .wave-back')).toBeNull()
  })

  it('turns a full tube river green for a freshwater fish', () => {
    const { container } = render(<MemberTube {...base} totalMl={3000} />)
    const root = tubeRoot(container)
    expect(root?.querySelector('[data-aquarium="fresh"]')).not.toBeNull()
    expect(root?.style.getPropertyValue('--color-water')).toBe('#2A9C80')
    expect(root?.style.getPropertyValue('--color-water-hi')).toBe('#6ACDB2')
  })

  it('turns a full tube reef blue for a saltwater fish', () => {
    const { container } = render(<MemberTube {...base} fishVariant="clownfish" totalMl={3000} />)
    const root = tubeRoot(container)
    expect(root?.querySelector('[data-aquarium="salt"]')).not.toBeNull()
    expect(root?.style.getPropertyValue('--color-water')).toBe('#1769C2')
  })

  it("Só água keeps today's plain tube: no scene, the theme water", () => {
    localStorage.setItem(TUBE_STYLE_KEY, 'agua')
    const { container } = render(<MemberTube {...base} totalMl={3000} />)
    expect(container.querySelector('[data-aquarium]')).toBeNull()
    expect(tubeRoot(container)).toBeNull()
    expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
  })

  it('two tubes on one page share no id', () => {
    const { container } = render(
      <>
        <MemberTube {...base} totalMl={3000} />
        <MemberTube {...base} name="Leo" isSelf totalMl={3000} />
      </>,
    )
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
