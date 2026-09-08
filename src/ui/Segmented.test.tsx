import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Segmented } from './Segmented'

const options = [
  { value: 'day', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
] as const

describe('Segmented', () => {
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
})
