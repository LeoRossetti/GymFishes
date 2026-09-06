import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager, QueryClient } from '@tanstack/react-query'
import type { TablesInsert } from '@/lib/database.types'
import { MAX_ATTEMPTS, type NewOp, type OutboxOp } from './outbox'
import { createOutboxStore } from './outboxStore'
import { flushOutbox, isTransientError } from './flush'

const api = vi.hoisted(() => ({
  upsertEntryRow: vi.fn(),
  updateEntry: vi.fn(),
  fetchEntriesSince: vi.fn(),
}))
vi.mock('./api', () => api)
const photos = vi.hoisted(() => ({
  uploadEntryPhoto: vi.fn(),
  removeEntryPhotos: vi.fn(),
}))
vi.mock('./photos', () => photos)

function memoryIo() {
  let stored: OutboxOp[] | undefined
  return {
    load: () => Promise.resolve(stored),
    save: (queue: OutboxOp[]) => {
      stored = queue
      return Promise.resolve()
    },
  }
}

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const insertOp: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

function harness() {
  const store = createOutboxStore(memoryIo())
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { store, client }
}

describe('flushOutbox', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    onlineManager.setOnline(true)
    api.upsertEntryRow.mockReset().mockResolvedValue(undefined)
    api.updateEntry.mockReset().mockResolvedValue(undefined)
    photos.uploadEntryPhoto.mockReset()
    photos.removeEntryPhotos.mockReset()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('sends an insert and settles the op', async () => {
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).toHaveBeenCalledWith(row)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('uploads photos first and writes the row with the returned paths', async () => {
    photos.uploadEntryPhoto.mockResolvedValue({ photoPath: 'g1/u1/e1.jpg', thumbPath: 'g1/u1/e1_thumb.jpg' })
    const { store, client } = harness()
    await store.enqueue({ ...insertOp, photo: { photo: new Blob(['p']), thumb: new Blob(['t']) } })
    await flushOutbox(client, store)
    expect(photos.uploadEntryPhoto).toHaveBeenCalled()
    expect(api.upsertEntryRow).toHaveBeenCalledWith({
      ...row,
      photo_path: 'g1/u1/e1.jpg',
      thumb_path: 'g1/u1/e1_thumb.jpg',
    })
  })

  it('a failed photo upload keeps the op — the row write never happens without its photo', async () => {
    photos.uploadEntryPhoto.mockRejectedValue(new Error('boom'))
    const { store, client } = harness()
    await store.enqueue({ ...insertOp, photo: { photo: new Blob(['p']), thumb: new Blob(['t']) } })
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(store.claim(new Set())?.attempts).toBe(1)
  })

  it('does nothing while offline — attempts are never burned in airplane mode', async () => {
    onlineManager.setOnline(false)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(store.claim(new Set())?.attempts).toBe(0)
  })

  it('a network error while apparently online stops the pass without counting attempts', async () => {
    api.upsertEntryRow.mockRejectedValue(new TypeError('Failed to fetch'))
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).toHaveBeenCalledTimes(1)
    expect(store.claim(new Set())?.attempts).toBe(0)
  })

  it('a server rejection counts an attempt and moves on to the next op', async () => {
    api.upsertEntryRow.mockRejectedValueOnce({ message: 'violates check constraint' }).mockResolvedValue(undefined)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    await flushOutbox(client, store)
    expect(store.getStatus().queued.has('e1')).toBe(true)
    expect(store.getStatus().queued.has('e2')).toBe(false)
  })

  it('after MAX_ATTEMPTS the op is failed and untouched by later flushes until retry', async () => {
    api.upsertEntryRow.mockRejectedValue({ message: 'rls' })
    const { store, client } = harness()
    await store.enqueue(insertOp)
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) await flushOutbox(client, store)
    expect(store.getStatus().failed.has('e1')).toBe(true)
    api.upsertEntryRow.mockClear()
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    await store.retry('e1')
    api.upsertEntryRow.mockResolvedValue(undefined)
    await flushOutbox(client, store)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('a delete sends the patch and then removes the storage objects', async () => {
    const { store, client } = harness()
    await store.enqueue({
      type: 'delete',
      id: 'e1',
      groupId: 'g1',
      profileId: 'u1',
      patch: { deleted_at: '2026-09-06T13:00:00.000Z' },
      removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'],
    })
    await flushOutbox(client, store)
    expect(api.updateEntry).toHaveBeenCalledWith('e1', { deleted_at: '2026-09-06T13:00:00.000Z' })
    expect(photos.removeEntryPhotos).toHaveBeenCalledWith(['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'])
  })

  it('a server-error backoff timer re-runs the flush and retries the op', async () => {
    api.upsertEntryRow.mockRejectedValueOnce({ message: 'rls' }).mockResolvedValue(undefined)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(store.claim(new Set())?.attempts).toBe(1)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(2000) // backoffMs(1)
    expect(api.upsertEntryRow).toHaveBeenCalledTimes(2)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('a network error while online schedules a 30 s retry', async () => {
    api.upsertEntryRow.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(undefined)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(store.claim(new Set())?.attempts).toBe(0)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(api.upsertEntryRow).toHaveBeenCalledTimes(2)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('a flush arriving mid-pass coalesces into one extra pass', async () => {
    let release = () => {}
    api.upsertEntryRow
      .mockImplementationOnce(
        () =>
          new Promise<void>((r) => {
            release = () => r()
          }),
      )
      .mockResolvedValue(undefined)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    const first = flushOutbox(client, store)
    await Promise.resolve() // let the first pass claim and start sending
    const second = flushOutbox(client, store) // coalesces via `again`
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    release()
    await first
    await second
    expect(store.getStatus().queued.size).toBe(0)
  })
})

describe('isTransientError', () => {
  it('classifies network and auth errors as transient, server rejections as real', () => {
    onlineManager.setOnline(true)
    expect(isTransientError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isTransientError({ message: 'JWT expired' })).toBe(true)
    expect(isTransientError({ message: 'new row violates row-level security' })).toBe(false)
    expect(isTransientError({ message: 'Invalid Refresh Token: Refresh Token Not Found' })).toBe(true)
    onlineManager.setOnline(false)
    expect(isTransientError({ message: 'anything' })).toBe(true)
    onlineManager.setOnline(true)
  })
})
