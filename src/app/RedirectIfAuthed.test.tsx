import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RedirectIfAuthed } from './RedirectIfAuthed'

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}))

describe('RedirectIfAuthed', () => {
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
