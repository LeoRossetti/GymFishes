import { describe, expect, it, vi } from 'vitest'
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

function Boom(): never {
  throw new Error('boom')
}

describe('AppShell', () => {
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
})
