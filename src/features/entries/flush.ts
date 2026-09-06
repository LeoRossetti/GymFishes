import { useEffect } from 'react'
import { onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { updateEntry, upsertEntryRow } from './api'
import { entriesKey } from './cache'
import type { OutboxOp } from './outbox'
import { outboxStore, type OutboxStore } from './outboxStore'
import { removeEntryPhotos, uploadEntryPhoto } from './photos'

/** Retry cadence after a network failure that happened while apparently online. */
const NETWORK_RETRY_MS = 30_000

let running = false
let again = false
let timer: ReturnType<typeof setTimeout> | undefined

function messageOf(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e !== null && typeof e === 'object' && 'message' in e) return String(e.message)
  return String(e)
}

/**
 * Being offline or logged out is a wait, not a failure (spec §14): transient errors never
 * count toward the 5-attempt cap — the op just waits for the next flush trigger.
 */
export function isTransientError(e: unknown): boolean {
  if (!onlineManager.isOnline()) return true
  return e instanceof TypeError || /fetch|network|jwt|401/i.test(messageOf(e))
}

/** Photos upload first; the row write only ever goes out carrying their paths (spec §12). */
async function send(op: OutboxOp): Promise<void> {
  if (op.type === 'insert') {
    let row = op.row
    if (op.photo) {
      const paths = await uploadEntryPhoto(op.groupId, op.profileId, op.id, op.photo.photo, op.photo.thumb)
      row = { ...row, photo_path: paths.photoPath, thumb_path: paths.thumbPath }
    }
    await upsertEntryRow(row)
    return
  }
  let patch = op.patch
  if (op.type === 'update' && op.photo) {
    const paths = await uploadEntryPhoto(op.groupId, op.profileId, op.id, op.photo.photo, op.photo.thumb)
    patch = { ...patch, photo_path: paths.photoPath, thumb_path: paths.thumbPath }
  }
  await updateEntry(op.id, patch)
  removeEntryPhotos(op.removePaths)
}

/**
 * Drain the queue head-first. Server rejections count an attempt and skip to the next op;
 * transient errors end the pass (everything after would fail the same way). Re-entrant
 * calls coalesce into one extra pass.
 */
export async function flushOutbox(client: QueryClient, store: OutboxStore = outboxStore): Promise<void> {
  if (running) {
    again = true
    return
  }
  running = true
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
  const flushedGroups = new Set<string>()
  let sawNetworkError = false
  try {
    await store.ready()
    const skip = new Set<string>()
    while (onlineManager.isOnline()) {
      const op = store.claim(skip)
      if (!op) break
      try {
        await send(op)
        store.settle(op.id, op.rev)
        flushedGroups.add(op.groupId)
      } catch (e) {
        if (isTransientError(e)) {
          sawNetworkError = onlineManager.isOnline()
          break
        }
        store.fail(op.id, op.rev)
        skip.add(op.id)
      }
    }
    for (const groupId of flushedGroups) {
      await client.invalidateQueries({ queryKey: entriesKey(groupId) })
    }
  } catch {
    // a flush pass never throws — whatever failed here retries on the next trigger
  } finally {
    running = false
  }
  if (again) {
    again = false
    return flushOutbox(client, store)
  }
  const wait = sawNetworkError ? NETWORK_RETRY_MS : store.nextBackoffMs()
  if (wait !== undefined) {
    timer = setTimeout(() => void flushOutbox(client, store), wait)
  }
}

/**
 * Flush triggers (spec §9/§12): app start, visibilitychange → visible, online. The
 * "after each mutation" trigger lives in the enqueue path. Mounted inside Guard, so
 * the Supabase session is already restored before the first send.
 */
export function useOutboxFlush(): void {
  const client = useQueryClient()
  useEffect(() => {
    void flushOutbox(client)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void flushOutbox(client)
    }
    const onOnline = () => void flushOutbox(client)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [client])
}
