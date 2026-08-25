import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test harness', () => {
  it('renders DOM and applies jest-dom matchers', () => {
    render(<p>água</p>)
    expect(screen.getByText('água')).toBeInTheDocument()
  })
})
