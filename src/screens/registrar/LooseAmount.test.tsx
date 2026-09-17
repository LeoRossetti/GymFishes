import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { emptyDraft } from './draft'
import { LooseAmount } from './LooseAmount'

describe('LooseAmount', () => {
  it('names the backspace key for screen readers while keeping the glyph', () => {
    render(<LooseAmount draft={emptyDraft(new Date())} dispatch={vi.fn()} />)
    const back = screen.getByRole('button', { name: 'Apagar' })
    expect(back).toHaveTextContent('⌫')
  })
})
