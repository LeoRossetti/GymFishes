import { useSyncExternalStore } from 'react'
import { loadOutbox, saveOutbox } from '@/lib/idb'
import {
  backoffMs,
  isFailed,
  mergeOp,
  statusOf,
  type NewOp,
  type OutboxOp,
  type OutboxStatus,
} from './outbox'

export type OutboxIo = {
  load: () => Promise<OutboxOp[] | undefined>
  save: (queue: OutboxOp[]) => Promise<void>
}

export function createOutboxStore(io: OutboxIo) {
  let queue: readonly OutboxOp[] = []
  let status: OutboxStatus = statusOf(queue)
  const listeners = new Set<() => void>()
  let readyPromise: Promise<void> | null = null

  function commit(next: readonly OutboxOp[]): void {
    queue = next
    status = statusOf(next)
    for (const listener of listeners) listener()
    // the in-memory queue keeps working this session even if the IDB write fails
    void io.save([...next]).catch(() => {})
  }

  function ready(): Promise<void> {
    readyPromise ??= io.load().then((stored) => {
      if (stored && stored.length > 0) commit(stored)
    })
    return readyPromise
  }

  return {
    ready,
    subscribe(fn: () => void): () => void {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    getStatus: (): OutboxStatus => status,
    async enqueue(op: NewOp): Promise<void> {
      await ready()
      commit(mergeOp(queue, op, Date.now()))
    },
    /** First op that is neither failed nor in `skip` — FIFO. */
    claim(skip: ReadonlySet<string>): OutboxOp | undefined {
      return queue.find((op) => !isFailed(op) && !skip.has(op.id))
    },
    /** Remove after a successful send — unless a merge changed the op mid-flight. */
    settle(id: string, rev: number): void {
      const op = queue.find((o) => o.id === id)
      if (op?.rev === rev) commit(queue.filter((o) => o.id !== id))
    },
    fail(id: string, rev: number): void {
      const op = queue.find((o) => o.id === id)
      if (op?.rev === rev) commit(queue.map((o) => (o.id === id ? { ...o, attempts: o.attempts + 1 } : o)))
    },
    async retry(id: string): Promise<void> {
      await ready()
      commit(queue.map((o) => (o.id === id ? { ...o, attempts: 0 } : o)))
    },
    nextBackoffMs(): number | undefined {
      const waiting = queue.filter((o) => o.attempts > 0 && !isFailed(o))
      if (waiting.length === 0) return undefined
      return Math.min(...waiting.map((o) => backoffMs(o.attempts)))
    },
  }
}

export type OutboxStore = ReturnType<typeof createOutboxStore>

export const outboxStore: OutboxStore = createOutboxStore({
  load: () => loadOutbox<OutboxOp[]>(),
  save: (queue) => saveOutbox(queue),
})

export function useOutboxStatus(): OutboxStatus {
  return useSyncExternalStore(outboxStore.subscribe, outboxStore.getStatus)
}
