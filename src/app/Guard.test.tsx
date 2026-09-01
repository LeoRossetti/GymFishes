import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Guard } from './Guard'

const refetch = vi.fn()
let bootstrapState: {
  isLoading: boolean
  isError: boolean
  data: unknown
  refetch: () => void
}

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => bootstrapState,
}))

describe('Guard', () => {
  beforeEach(() => {
    refetch.mockReset()
    bootstrapState = { isLoading: false, isError: true, data: undefined, refetch }
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
})
