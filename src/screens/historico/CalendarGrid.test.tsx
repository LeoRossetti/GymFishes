import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DayKey } from '@/lib/dates'
import { monthPeriod } from '@/lib/periods'
import { CalendarGrid } from './CalendarGrid'

const month = monthPeriod('2026-08-01')
const today = '2026-08-10'
const totals = new Map<DayKey, number>([
  ['2026-08-03', 1500],
  ['2026-08-07', 3200],
])

function setup(selected: DayKey | null = null) {
  const onSelect = vi.fn()
  render(
    <CalendarGrid
      period={month}
      totals={totals}
      today={today}
      firstDay="2026-08-02"
      selected={selected}
      onSelect={onSelect}
    />,
  )
  return onSelect
}

describe('CalendarGrid', () => {
  it('renders every day of the month', () => {
    setup()
    expect(screen.getByRole('button', { name: 'sábado, 1 de agosto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'segunda, 31 de agosto' })).toBeInTheDocument()
  })

  it('fills days by step', () => {
    setup()
    expect(screen.getByRole('button', { name: 'segunda, 3 de agosto' })).toHaveAttribute('data-step', '2')
    expect(screen.getByRole('button', { name: 'sexta, 7 de agosto' })).toHaveAttribute('data-step', '4')
    expect(screen.getByRole('button', { name: 'terça, 4 de agosto' })).toHaveAttribute('data-step', '0')
  })

  it('blanks days before the first register and after today', () => {
    setup()
    expect(screen.getByRole('button', { name: 'sábado, 1 de agosto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'terça, 11 de agosto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'segunda, 10 de agosto' })).toBeEnabled()
  })

  it('reports the tapped day', async () => {
    const onSelect = setup()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 3 de agosto' }))
    expect(onSelect).toHaveBeenCalledWith('2026-08-03')
  })

  it('marks the selected day pressed', () => {
    setup('2026-08-03')
    expect(screen.getByRole('button', { name: 'segunda, 3 de agosto', pressed: true })).toBeInTheDocument()
  })
})
