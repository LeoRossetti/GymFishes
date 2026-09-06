import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import type { NewOp } from './outbox'
import { useEntryOps, type NewEntry } from './mutations'

const store = vi.hoisted(() => ({
  enqueue: vi.fn<(op: NewOp) => Promise<void>>(),
  retry: vi.fn<(id: string) => Promise<void>>(),
}))
vi.mock('./outboxStore', () => ({ outboxStore: store }))
const flush = vi.hoisted(() => ({ flushOutbox: vi.fn() }))
vi.mock('./flush', () => flush)

const existing: Entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  photo_path: 'g1/u1/e1.jpg',
  thumb_path: 'g1/u1/e1_thumb.jpg',
  drank_at: '2026-09-01T10:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  deleted_at: null,
}

const novo: NewEntry = {
  id: 'e2',
  profileId: 'u1',
  totalMl: 300,
  composition: [],
  note: null,
  drankAt: new Date('2026-09-01T12:00:00Z'),
  photo: null,
}

function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(entriesKey('g1'), [existing])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useEntryOps('g1', 'u1'), { wrapper })
  return { client, ops: result.current }
}

describe('useEntryOps', () => {
  beforeEach(() => {
    store.enqueue.mockReset().mockResolvedValue(undefined)
    store.retry.mockReset().mockResolvedValue(undefined)
    flush.flushOutbox.mockReset()
  })

  it('insert patches the cache optimistically (updated_at empty) and enqueues + flushes', async () => {
    const { client, ops } = harness()
    ops.insert(novo)
    await waitFor(() => {
      const list = client.getQueryData<Entry[]>(entriesKey('g1'))
      expect(list?.map((e) => e.id)).toEqual(['e2', 'e1'])
      expect(list?.[0]?.updated_at).toBe('')
    })
    await waitFor(() => expect(flush.flushOutbox).toHaveBeenCalled())
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'insert',
        id: 'e2',
        groupId: 'g1',
        profileId: 'u1',
        row: expect.objectContaining({ id: 'e2', total_ml: 300, group_id: 'g1' }),
      }),
    )
  })

  it('update merges the patch, recomputes drank_on, and enqueues an update op', async () => {
    const { client, ops } = harness()
    ops.update(existing, { total_ml: 900, drank_at: '2026-08-30T15:00:00Z' })
    await waitFor(() => {
      const row = client.getQueryData<Entry[]>(entriesKey('g1'))?.find((e) => e.id === 'e1')
      expect(row?.total_ml).toBe(900)
      expect(row?.drank_on).toBe('2026-08-30')
      expect(row?.updated_at).toBe('')
    })
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'update', id: 'e1', removePaths: [] }),
    )
  })

  it('removing the photo carries the old storage paths for cleanup', async () => {
    const { ops } = harness()
    ops.update(existing, { photo_path: null, thumb_path: null })
    await waitFor(() =>
      expect(store.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'] }),
      ),
    )
  })

  it('remove drops the row optimistically and enqueues a delete with the paths', async () => {
    const { client, ops } = harness()
    ops.remove(existing)
    await waitFor(() => expect(client.getQueryData<Entry[]>(entriesKey('g1'))).toEqual([]))
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delete',
        id: 'e1',
        patch: expect.objectContaining({ deleted_at: expect.any(String) }),
        removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'],
      }),
    )
  })

  it('retry resets attempts and flushes', async () => {
    const { ops } = harness()
    ops.retry('e1')
    await waitFor(() => expect(flush.flushOutbox).toHaveBeenCalled())
    expect(store.retry).toHaveBeenCalledWith('e1')
  })
})
