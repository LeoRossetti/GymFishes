import { describe, expect, it } from 'vitest'
import type { TablesInsert } from '@/lib/database.types'
import { MAX_ATTEMPTS, type NewOp, type OutboxOp } from './outbox'
import { createOutboxStore, type OutboxIo } from './outboxStore'

function memoryIo(seed?: OutboxOp[]) {
  let stored: OutboxOp[] | undefined = seed
  return {
    load: () => Promise.resolve(stored),
    save: (queue: OutboxOp[]) => {
      stored = queue
      return Promise.resolve()
    },
    get stored() {
      return stored
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

describe('outboxStore', () => {
  it('enqueue persists and notifies subscribers with fresh status', async () => {
    const io = memoryIo()
    const store = createOutboxStore(io)
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    await store.enqueue(insertOp)
    expect(notified).toBeGreaterThan(0)
    expect(store.getStatus().pending.has('e1')).toBe(true)
    expect(io.stored).toHaveLength(1)
  })

  it('restores the queue saved by a previous instance', async () => {
    const io = memoryIo()
    const a = createOutboxStore(io)
    await a.enqueue(insertOp)
    const b = createOutboxStore(io)
    await b.ready()
    expect(b.claim(new Set())?.id).toBe('e1')
  })

  it('settle removes only the rev that was sent', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    const op = store.claim(new Set())!
    // a merge lands while the send is in flight
    await store.enqueue({ type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] })
    store.settle(op.id, op.rev)
    expect(store.getStatus().queued.has('e1')).toBe(true)
    const merged = store.claim(new Set())!
    store.settle(merged.id, merged.rev)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('fail increments attempts; at MAX_ATTEMPTS the op stops being claimable; retry revives it', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const op = store.claim(new Set())!
      store.fail(op.id, op.rev)
    }
    expect(store.claim(new Set())).toBeUndefined()
    expect(store.getStatus().failed.has('e1')).toBe(true)
    await store.retry('e1')
    expect(store.claim(new Set())?.id).toBe('e1')
  })

  it('claim skips the given ids and respects FIFO', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    expect(store.claim(new Set(['e1']))?.id).toBe('e2')
  })

  it('nextBackoffMs is the smallest backoff among retryable ops', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    expect(store.nextBackoffMs()).toBeUndefined()
    const op = store.claim(new Set())!
    store.fail(op.id, op.rev)
    expect(store.nextBackoffMs()).toBe(2000)
  })

  it('a failing io.save never breaks the in-memory queue', async () => {
    const io: OutboxIo = {
      load: () => Promise.resolve(undefined),
      save: () => Promise.reject(new Error('quota')),
    }
    const store = createOutboxStore(io)
    await store.enqueue(insertOp)
    expect(store.getStatus().pending.has('e1')).toBe(true)
    expect(store.claim(new Set())?.id).toBe('e1')
  })
})
