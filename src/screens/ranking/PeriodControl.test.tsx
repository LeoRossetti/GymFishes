import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { allPeriod, dayPeriod, weekPeriod, type Period } from '@/lib/periods'
import { PeriodControl } from './PeriodControl'

const today = '2026-08-10'

function setup(period: Period = dayPeriod(today)) {
  const onChange = vi.fn()
  render(<PeriodControl period={period} today={today} firstDay="2026-06-12" onChange={onChange} />)
  return onChange
}

describe('PeriodControl', () => {
  it('opens on Hoje with the forward arrow disabled', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Hoje', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo período' })).toBeDisabled()
  })

  it('steps back a day', async () => {
    const onChange = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
    expect(onChange).toHaveBeenCalledWith(dayPeriod('2026-08-09'))
  })

  it('switches to the current week', async () => {
    const onChange = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    expect(onChange).toHaveBeenCalledWith(weekPeriod(today))
  })

  it('labels a past week and enables the forward arrow', () => {
    setup(weekPeriod('2026-08-03'))
    expect(screen.getByText('Semana de 3–9 de agosto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo período' })).toBeEnabled()
  })

  it('hides the arrows for Total', () => {
    setup(allPeriod('2026-06-12', today))
    expect(screen.getByText('Desde 12 de junho')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Período anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Próximo período' })).toBeNull()
  })
})
