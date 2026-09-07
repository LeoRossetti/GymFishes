import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncPill } from './SyncPill'

const status = vi.hoisted(() => ({ offline: false, stale: false }))
vi.mock('@/features/entries/queries', () => ({
  useSyncStatus: () => ({ ...status }),
}))

describe('SyncPill', () => {
  it('renders nothing when online and fresh', () => {
    status.offline = false
    status.stale = false
    const { container } = render(<SyncPill groupId="g1" />)
    expect(container).toBeEmptyDOMElement()
  })
  it('shows Sem conexão when offline', () => {
    status.offline = true
    status.stale = false
    render(<SyncPill groupId="g1" />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
  })
  it('shows Dados desatualizados when stale', () => {
    status.offline = false
    status.stale = true
    render(<SyncPill groupId="g1" />)
    expect(screen.getByText('Dados desatualizados')).toBeInTheDocument()
  })
})
