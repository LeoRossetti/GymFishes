import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager, QueryClient } from '@tanstack/react-query'
import type { TablesInsert } from '@/lib/database.types'
import type { NewOp, OutboxOp } from './outbox'
import { createOutboxStore } from './outboxStore'
import { flushOutbox } from './flush'

const api = vi.hoisted(() => ({
  upsertEntryRow: vi.fn(),
  updateEntry: vi.fn(),
  fetchEntriesSince: vi.fn(),
}))
vi.mock('./api', () => api)
vi.mock('./photos', () => ({ uploadEntryPhoto: vi.fn(), removeEntryPhotos: vi.fn() }))

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const op: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

describe('offline register → force-quit → reopen → sync (success criterion 3)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    api.upsertEntryRow.mockReset().mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('the op persists across a restart and flushes on next open', async () => {
    // shared "disk"
    let stored: OutboxOp[] | undefined
    const io = {
      load: () => Promise.resolve(stored),
      save: (q: OutboxOp[]) => {
        stored = q
        return Promise.resolve()
      },
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // session 1: airplane mode — register, flush does nothing, app "force-quits"
    onlineManager.setOnline(false)
    const session1 = createOutboxStore(io)
    await session1.enqueue(op)
    await flushOutbox(client, session1)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(stored).toHaveLength(1)

    // session 2: fresh store over the same disk, back online — flush on app start
    onlineManager.setOnline(true)
    const session2 = createOutboxStore(io)
    await flushOutbox(client, session2)
    expect(api.upsertEntryRow).toHaveBeenCalledWith(row)
    expect(stored).toHaveLength(0)
    expect(session2.getStatus().queued.size).toBe(0)
  })
})
