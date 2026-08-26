import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hoje } from './Hoje'

describe('Hoje', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the title, the formatted date and the empty state', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T15:00:00Z'))

    render(<Hoje />)

    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument()
    expect(screen.getByText('segunda, 10 de agosto')).toBeInTheDocument()
    expect(screen.getByText('Nenhum registro hoje. Bora beber água. 💧')).toBeInTheDocument()
  })
})
