import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { TabBar } from './TabBar'
import { TAB_ROUTES } from './routes'

const EMOJI = /\p{Extended_Pictographic}/u

function renderAt(route: string, onRegister = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TabBar onRegister={onRegister} />
    </MemoryRouter>,
  )
}

describe('TabBar', () => {
  it('renders one tab per registered route plus the register button', () => {
    renderAt('/hoje')
    for (const route of TAB_ROUTES) {
      expect(screen.getByRole('link', { name: route.label })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Registrar água' })).toBeInTheDocument()
  })

  it('draws every tab with an svg icon and no emoji', () => {
    renderAt('/hoje')
    const nav = screen.getByRole('navigation', { name: 'Abas' })
    expect(nav.textContent).not.toMatch(EMOJI)
    for (const link of screen.getAllByRole('link')) {
      expect(link.querySelector('svg[data-icon]')).not.toBeNull()
    }
    expect(screen.getByRole('button', { name: 'Registrar água' }).querySelector('svg[data-icon="plus"]')).not.toBeNull()
  })

  it('marks only the current tab as the current page', () => {
    renderAt('/ranking')
    expect(screen.getByRole('link', { name: 'Ranking' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
  })

  it('is not fixed to the window: the frame places it', () => {
    renderAt('/hoje')
    expect(screen.getByRole('navigation', { name: 'Abas' })).not.toHaveClass('fixed')
  })

  it('calls onRegister when the plus button is tapped', async () => {
    const onRegister = vi.fn()
    renderAt('/hoje', onRegister)
    await userEvent.click(screen.getByRole('button', { name: 'Registrar água' }))
    expect(onRegister).toHaveBeenCalledTimes(1)
  })
})
