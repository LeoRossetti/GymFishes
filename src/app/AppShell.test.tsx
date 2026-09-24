import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import { AppShell } from './AppShell'

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({ data: { profile: { id: 'u1' }, groupId: 'g1' } }),
}))
vi.mock('@/features/entries/realtime', () => ({ useRealtimeEntries: () => {} }))
vi.mock('@/features/group/queries', () => ({ useMembers: () => ({ data: [] }) }))
vi.mock('@/features/entries/queries', () => ({ useEntries: () => ({ data: [] }) }))

const update = vi.hoisted(() => ({ ready: false, apply: vi.fn(() => Promise.resolve()) }))
vi.mock('@/features/pwa/registerSW', () => ({
  useAppUpdate: () => ({ ready: update.ready, apply: update.apply }),
}))

function Boom(): never {
  throw new Error('boom')
}

describe('AppShell', () => {
  afterEach(() => {
    update.ready = false
  })

  it('resets the error boundary when the route changes', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/hoje" element={<Boom />} />
          <Route path="/perfil" element={<p>perfil ok</p>} />
        </Route>
      </Routes>,
      { route: '/hoje' },
    )
    expect(screen.getByText('Algo quebrou nesta aba')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Perfil/ }))
    expect(screen.getByText('perfil ok')).toBeInTheDocument()
  })

  it('shows the update bar inside the shell when a new build is waiting', () => {
    update.ready = true
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/hoje" element={<p>hoje ok</p>} />
        </Route>
      </Routes>,
      { route: '/hoje' },
    )
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível')
  })

  it('scrolls the screen inside a scroll region and keeps the tab bar as a sibling below it', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/hoje" element={<p>hoje ok</p>} />
        </Route>
      </Routes>,
      { route: '/hoje' },
    )
    const main = screen.getByRole('main')
    expect(main).toHaveClass('scroll-region')
    expect(main).toContainElement(screen.getByText('hoje ok'))
    const nav = screen.getByRole('navigation', { name: 'Abas' })
    expect(nav).not.toHaveClass('fixed')
    expect(main.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('the update bar is a row between the screen and the tab bar, not a floating box', () => {
    update.ready = true
    renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/hoje" element={<p>hoje ok</p>} />
        </Route>
      </Routes>,
      { route: '/hoje' },
    )
    const bar = screen.getByRole('status')
    expect(bar).not.toHaveClass('fixed')
    const main = screen.getByRole('main')
    const nav = screen.getByRole('navigation', { name: 'Abas' })
    expect(main.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
