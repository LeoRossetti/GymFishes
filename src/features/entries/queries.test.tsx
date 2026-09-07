import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import { useEntries, syncStatusOf } from './queries'

const api = vi.hoisted(() => ({ fetchEntriesSince: vi.fn() }))
vi.mock('./api', () => api)
const queued = vi.hoisted(() => new Set<string>())
vi.mock('./outboxStore', () => ({
  outboxStore: {
    ready: () => Promise.resolve(),
    getStatus: () => ({ pending: queued, failed: new Set<string>(), queued }),
  },
}))

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'e1',
    profile_id: 'u1',
    group_id: 'g1',
    total_ml: 500,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: '2026-09-01T12:00:00+00:00',
    drank_on: '2026-09-01',
    created_at: '2026-09-01T12:00:00+00:00',
    updated_at: '2026-09-01T12:00:00+00:00',
    deleted_at: null,
    ...overrides,
  }
}

describe('useEntries', () => {
  it('refetches incrementally from the watermark and keeps optimistic rows', async () => {
    queued.clear()
    queued.add('pending')
    const synced = makeEntry({ id: 'synced', drank_at: '2026-09-05T08:00:00+00:00', updated_at: '2026-09-05T10:00:00+00:00' })
    const optimistic = makeEntry({ id: 'pending', drank_at: '2026-09-06T09:00:00+00:00', updated_at: '' })
    api.fetchEntriesSince.mockResolvedValue([
      makeEntry({ id: 'partner', drank_at: '2026-09-06T08:00:00+00:00', updated_at: '2026-09-05T11:00:00+00:00' }),
    ])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(entriesKey('g1'), [optimistic, synced])
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useEntries('g1'), { wrapper })
    await waitFor(() => expect(api.fetchEntriesSince).toHaveBeenCalled())
    expect(api.fetchEntriesSince).toHaveBeenCalledWith('g1', '2026-09-05T10:00:00+00:00')
    await waitFor(() =>
      expect(result.current.data?.map((e) => e.id)).toEqual(['pending', 'partner', 'synced']),
    )
  })
})

describe('syncStatusOf', () => {
  const cincoMin = 5 * 60_000
  it('offline wins and suppresses stale', () => {
    expect(syncStatusOf(false, 1000, 1000 + cincoMin + 1)).toEqual({ offline: true, stale: false })
  })
  it('stale after 5 minutes without a successful sync, but only once data existed', () => {
    expect(syncStatusOf(true, 1000, 1000 + cincoMin + 1)).toEqual({ offline: false, stale: true })
    expect(syncStatusOf(true, 1000, 1000 + cincoMin)).toEqual({ offline: false, stale: false })
    expect(syncStatusOf(true, 0, cincoMin * 10)).toEqual({ offline: false, stale: false })
  })
})
