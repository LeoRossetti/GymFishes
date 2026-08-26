import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TabBar } from './TabBar'
import { TAB_ROUTES } from './routes'

describe('TabBar', () => {
  it('renders one tab per registered route plus the register button', () => {
    render(
      <MemoryRouter>
        <TabBar />
      </MemoryRouter>,
    )
    for (const route of TAB_ROUTES) {
      expect(screen.getByRole('link', { name: new RegExp(route.label) })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Registrar água' })).toBeInTheDocument()
  })
})
