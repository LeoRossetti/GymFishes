import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { TabBar } from './TabBar'
import { TAB_ROUTES } from './routes'

describe('TabBar', () => {
  it('renders one tab per registered route plus the register button', () => {
    render(
      <MemoryRouter>
        <TabBar onRegister={vi.fn()} />
      </MemoryRouter>,
    )
    for (const route of TAB_ROUTES) {
      expect(screen.getByRole('link', { name: new RegExp(route.label) })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Registrar água' })).toBeInTheDocument()
  })

  it('calls onRegister when the plus button is tapped', async () => {
    const onRegister = vi.fn()
    render(
      <MemoryRouter>
        <TabBar onRegister={onRegister} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Registrar água' }))
    expect(onRegister).toHaveBeenCalledTimes(1)
  })
})
