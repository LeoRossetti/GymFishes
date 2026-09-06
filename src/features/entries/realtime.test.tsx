import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import { useRealtimeEntries } from './realtime'

type Handler = (payload: { new: unknown }) => void
const handlers: Handler[] = []
const channel = {
  on: vi.fn((_event: string, _filter: unknown, cb: Handler) => {
    handlers.push(cb)
    return channel
  }),
  subscribe: vi.fn(() => channel),
}
const removeChannel = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: () => channel,
    removeChannel: (...args: unknown[]) => removeChannel(...args),
  },
}))

const row: Entry = {
  id: 'e9',
  profile_id: 'u2',
  group_id: 'g1',
  total_ml: 400,
  composition: [],
  note: null,
  photo_path: null,
  thumb_path: null,
  drank_at: '2026-09-01T15:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T15:00:00+00:00',
  updated_at: '2026-09-01T15:00:00+00:00',
  deleted_at: null,
}

function harness() {
  const client = new QueryClient()
  client.setQueryData(entriesKey('g1'), [])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

describe('useRealtimeEntries', () => {
  beforeEach(() => {
    handlers.length = 0
    removeChannel.mockReset()
  })

  it('patches an incoming insert into the cache', () => {
    const { client, wrapper } = harness()
    renderHook(() => useRealtimeEntries('g1'), { wrapper })
    handlers[0]?.({ new: row })
    expect(client.getQueryData<Entry[]>(entriesKey('g1'))?.map((e) => e.id)).toEqual(['e9'])
  })

  it('removes an incoming soft delete', () => {
    const { client, wrapper } = harness()
    client.setQueryData(entriesKey('g1'), [row])
    renderHook(() => useRealtimeEntries('g1'), { wrapper })
    handlers[0]?.({ new: { ...row, deleted_at: '2026-09-01T16:00:00Z' } })
    expect(client.getQueryData<Entry[]>(entriesKey('g1'))).toEqual([])
  })

  it('unsubscribes on unmount and ignores a missing group', () => {
    const { wrapper } = harness()
    const { unmount } = renderHook(() => useRealtimeEntries('g1'), { wrapper })
    unmount()
    expect(removeChannel).toHaveBeenCalled()
    renderHook(() => useRealtimeEntries(null), { wrapper })
    expect(handlers).toHaveLength(1) // no second subscription
  })
})
