import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

function setup(nextDisabled = false) {
  const onPrev = vi.fn()
  const onNext = vi.fn()
  render(
    <Stepper
      label="Julho"
      prevLabel="Anterior"
      nextLabel="Próximo"
      nextDisabled={nextDisabled}
      onPrev={onPrev}
      onNext={onNext}
    />,
  )
  return { onPrev, onNext }
}

describe('Stepper', () => {
  it('shows the label and steps both ways', async () => {
    const { onPrev, onNext } = setup()
    expect(screen.getByText('Julho')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('disables the forward arrow on demand', () => {
    setup(true)
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })
})
