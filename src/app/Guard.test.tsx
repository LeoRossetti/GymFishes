import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { Guard } from './Guard'

const refetch = vi.fn()
let bootstrapState: {
  isPending: boolean
  isError: boolean
  fetchStatus: 'fetching' | 'paused' | 'idle'
  data: unknown
  refetch: () => void
}
let sessionState: { session: { user: { id: string } } | null; loading: boolean }

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => sessionState,
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => bootstrapState,
}))

describe('Guard', () => {
  beforeEach(() => {
    refetch.mockReset()
    sessionState = { session: { user: { id: 'user-1' } }, loading: false }
    bootstrapState = { isPending: false, isError: true, fetchStatus: 'idle', data: undefined, refetch }
  })

  it('shows the app name while the session is resolving', () => {
    sessionState = { session: null, loading: true }
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )
    expect(screen.getByText('GymFishes')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('shows the app name while bootstrap has no data yet', () => {
    bootstrapState = { isPending: true, isError: false, fetchStatus: 'idle', data: undefined, refetch }
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )
    expect(screen.getByText('GymFishes')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('does not redirect to onboarding while bootstrap is pending', () => {
    bootstrapState = { isPending: true, isError: false, fetchStatus: 'idle', data: undefined, refetch }
    render(
      <MemoryRouter initialEntries={['/ranking']}>
        <Routes>
          <Route
            path="/ranking"
            element={
              <Guard>
                <div>Conteúdo protegido</div>
              </Guard>
            }
          />
          <Route path="/inicio" element={<div>Onboarding</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Onboarding')).not.toBeInTheDocument()
    expect(screen.getByText('GymFishes')).toBeInTheDocument()
  })

  it('shows the retry UI instead of redirecting to /inicio when bootstrap fails', async () => {
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )

    expect(screen.getByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('shows the retry UI when bootstrap fails and there is no cached data', () => {
    bootstrapState = { isPending: false, isError: true, fetchStatus: 'idle', data: undefined, refetch }
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )

    expect(screen.getByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('renders children instead of the error screen when a cached bootstrap survives a refetch error', () => {
    bootstrapState = {
      isPending: false,
      isError: true,
      fetchStatus: 'idle',
      data: { profile: { id: 'user-1' }, groupId: 'group-1' },
      refetch,
    }
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
    expect(screen.queryByText('Algo deu errado. Tente de novo.')).not.toBeInTheDocument()
  })

  it('says "Sem conexão" with a retry when bootstrap is paused offline with no data', () => {
    bootstrapState = { isPending: true, isError: false, fetchStatus: 'paused', data: undefined, refetch }
    render(
      <MemoryRouter initialEntries={['/hoje']}>
        <Guard>
          <div>Conteúdo protegido</div>
        </Guard>
      </MemoryRouter>,
    )
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument()
    expect(screen.queryByText('GymFishes')).not.toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })
})
