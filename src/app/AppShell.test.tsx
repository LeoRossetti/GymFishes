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
})
