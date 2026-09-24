import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemberTube } from './MemberTube'

const base = { name: 'Ana', isSelf: false, accent: 'pink', fishVariant: 'betta', scaleMl: 3000 }

describe('MemberTube', () => {
  it('shows three bubbles inside the water once there is water', () => {
    const { container } = render(<MemberTube {...base} totalMl={1200} />)
    expect(container.querySelectorAll('.bubble')).toHaveLength(3)
    expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
  })

  it('an empty tube has no fish and no bubbles', () => {
    const { container } = render(<MemberTube {...base} totalMl={0} />)
    expect(container.querySelectorAll('.bubble')).toHaveLength(0)
    expect(container.querySelector('svg[data-fish]')).toBeNull()
  })
})
