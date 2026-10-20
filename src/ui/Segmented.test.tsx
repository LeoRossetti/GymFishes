import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Segmented } from './Segmented'

const motionPrefs = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => motionPrefs.reduced,
}))

const options = [
  { value: 'day', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
] as const

describe('Segmented', () => {
  afterEach(() => {
    motionPrefs.reduced = false
  })

  it('marks the selected option pressed', () => {
    render(<Segmented label="Período" options={options} value="day" onChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semana', pressed: false })).toBeInTheDocument()
  })

  it('reports the tapped value', async () => {
    const onChange = vi.fn()
    render(<Segmented label="Período" options={options} value="day" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })

  it('the pressed state follows the value', () => {
    const { rerender } = render(<Segmented label="Período" options={options} value="day" onChange={vi.fn()} />)
    rerender(<Segmented label="Período" options={options} value="week" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Semana', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: false })).toBeInTheDocument()
  })

  it('under reduced motion the pressed state still follows the value', () => {
    motionPrefs.reduced = true
    const { rerender } = render(<Segmented label="Período" options={options} value="day" onChange={vi.fn()} />)
    rerender(<Segmented label="Período" options={options} value="week" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Semana', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: false })).toBeInTheDocument()
  })
})
