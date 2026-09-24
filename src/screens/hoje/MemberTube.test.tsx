import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemberTube } from './MemberTube'

const base = { name: 'Ana', isSelf: false, accent: 'pink', fishVariant: 'betta', scaleMl: 3000 }

describe('MemberTube', () => {
  it('shows the member fish once there is water', () => {
    const { container } = render(<MemberTube {...base} totalMl={1200} />)
    expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
  })

  it('an empty tube has no fish', () => {
    const { container } = render(<MemberTube {...base} totalMl={0} />)
    expect(container.querySelector('svg[data-fish]')).toBeNull()
  })
})
