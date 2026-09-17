import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RedirectIfAuthed } from './RedirectIfAuthed'

let sessionState: { session: { user: { id: string } } | null; loading: boolean }

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => sessionState,
}))

describe('RedirectIfAuthed', () => {
  beforeEach(() => {
    sessionState = { session: { user: { id: 'user-1' } }, loading: false }
  })

  it('shows the app name while the session is resolving', () => {
    sessionState = { session: null, loading: true }
    render(
      <MemoryRouter initialEntries={['/entrar']}>
        <Routes>
          <Route
            path="/entrar"
            element={
              <RedirectIfAuthed>
                <div>Tela de login</div>
              </RedirectIfAuthed>
            }
          />
          <Route path="/hoje" element={<div>Tela hoje</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('GymFishes')).toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })

  it('sends an authenticated session on /entrar to /hoje', () => {
    render(
      <MemoryRouter initialEntries={['/entrar']}>
        <Routes>
          <Route
            path="/entrar"
            element={
              <RedirectIfAuthed>
                <div>Tela de login</div>
              </RedirectIfAuthed>
            }
          />
          <Route path="/hoje" element={<div>Tela hoje</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Tela hoje')).toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })
})
