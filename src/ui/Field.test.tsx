import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field } from './Field'

describe('Field', () => {
  it('links the error message to the input', () => {
    render(<Field label="Nome" value="" onChange={() => {}} error="Curto demais" />)
    const input = screen.getByLabelText('Nome')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Curto demais')
  })
  it('sets no error attributes when valid', () => {
    render(<Field label="Nome" value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Nome')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})
