import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import { useInsertEntry, useUpdateEntry } from './mutations'

const api = vi.hoisted(() => ({
  insertEntry: vi.fn(),
  updateEntry: vi.fn(),
}))
vi.mock('./api', () => api)

const existing: Entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  photo_path: null,
  thumb_path: null,
  drank_at: '2026-09-01T10:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  deleted_at: null,
}

function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(entriesKey('g1'), [existing])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

const novo = {
  id: 'e2',
  profileId: 'u1',
  totalMl: 300,
  composition: [],
  note: null,
  drankAt: new Date('2026-09-01T12:00:00Z'),
  photoPath: null,
  thumbPath: null,
}

describe('useInsertEntry', () => {
  beforeEach(() => {
    api.insertEntry.mockReset().mockResolvedValue(undefined)
    api.updateEntry.mockReset().mockResolvedValue(undefined)
  })

  it('adds the entry to the cache before the network resolves', async () => {
    let release = () => {}
    api.insertEntry.mockImplementation(
      () => new Promise<void>((r) => { release = () => r() }),
    )
    const { client, wrapper } = harness()
    const { result } = renderHook(() => useInsertEntry('g1'), { wrapper })
    result.current.mutate(novo)
    await waitFor(() => {
      const list = client.getQueryData<Entry[]>(entriesKey('g1'))
      expect(list?.map((e) => e.id)).toEqual(['e2', 'e1'])
    })
    release()
  })

  it('rolls back when the insert fails', async () => {
    api.insertEntry.mockRejectedValue(new Error('down'))
    const { client, wrapper } = harness()
    const { result } = renderHook(() => useInsertEntry('g1'), { wrapper })
    result.current.mutate(novo)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData<Entry[]>(entriesKey('g1'))?.map((e) => e.id)).toEqual(['e1'])
  })

  it('calls onFailure even when the component unmounts before the network settles', async () => {
    api.insertEntry.mockRejectedValue(new Error('down'))
    const onFailure = vi.fn()
    const { wrapper } = harness()
    const { result, unmount } = renderHook(() => useInsertEntry('g1', onFailure), { wrapper })
    result.current.mutate(novo)
    unmount()
    await waitFor(() => expect(onFailure).toHaveBeenCalledTimes(1))
  })
})

describe('useUpdateEntry', () => {
  beforeEach(() => {
    api.insertEntry.mockReset().mockResolvedValue(undefined)
    api.updateEntry.mockReset().mockResolvedValue(undefined)
  })

  it('recomputes drank_on when the patch changes drank_at', async () => {
    const { client, wrapper } = harness()
    const { result } = renderHook(() => useUpdateEntry('g1'), { wrapper })
    result.current.mutate({ id: 'e1', patch: { drank_at: '2026-08-30T15:00:00Z' } })
    await waitFor(() => {
      const list = client.getQueryData<Entry[]>(entriesKey('g1'))
      expect(list?.[0]?.drank_on).toBe('2026-08-30')
    })
  })

  it('removes the row optimistically when the patch soft-deletes', async () => {
    const { client, wrapper } = harness()
    const { result } = renderHook(() => useUpdateEntry('g1'), { wrapper })
    result.current.mutate({ id: 'e1', patch: { deleted_at: '2026-09-01T13:00:00Z' } })
    await waitFor(() =>
      expect(client.getQueryData<Entry[]>(entriesKey('g1'))).toEqual([]),
    )
  })

  it('rolls back a failed update', async () => {
    api.updateEntry.mockRejectedValue(new Error('down'))
    const { client, wrapper } = harness()
    const { result } = renderHook(() => useUpdateEntry('g1'), { wrapper })
    result.current.mutate({ id: 'e1', patch: { total_ml: 900 } })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData<Entry[]>(entriesKey('g1'))?.[0]?.total_ml).toBe(500)
  })
})
