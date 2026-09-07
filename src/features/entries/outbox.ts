import type { TablesInsert } from '@/lib/database.types'
import type { EntryPatch } from './api'

export const MAX_ATTEMPTS = 5

export type OpPhoto = { photo: Blob; thumb: Blob }

type Meta = {
  /** Entry id — the queue holds at most one op per entry. */
  id: string
  groupId: string
  profileId: string
  createdAt: number
  attempts: number
  /** Bumped on every merge; the flusher only settles or fails the rev it actually sent. */
  rev: number
}

export type InsertOp = Meta & { type: 'insert'; row: TablesInsert<'entries'>; photo?: OpPhoto }
export type UpdateOp = Meta & { type: 'update'; patch: EntryPatch; photo?: OpPhoto; removePaths: string[] }
export type DeleteOp = Meta & { type: 'delete'; patch: EntryPatch; removePaths: string[] }
export type OutboxOp = InsertOp | UpdateOp | DeleteOp

export type NewOp =
  | Omit<InsertOp, 'createdAt' | 'attempts' | 'rev'>
  | Omit<UpdateOp, 'createdAt' | 'attempts' | 'rev'>
  | Omit<DeleteOp, 'createdAt' | 'attempts' | 'rev'>

/** 2s, 4s, 8s, 16s, 32s — capped at 60s (spec §12). */
export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 60_000)
}

export function isFailed(op: OutboxOp): boolean {
  return op.attempts >= MAX_ATTEMPTS
}

export type OutboxStatus = {
  pending: ReadonlySet<string>
  failed: ReadonlySet<string>
  queued: ReadonlySet<string>
}

export function statusOf(queue: readonly OutboxOp[]): OutboxStatus {
  const pending = new Set<string>()
  const failed = new Set<string>()
  for (const op of queue) (isFailed(op) ? failed : pending).add(op.id)
  return { pending, failed, queued: new Set(queue.map((o) => o.id)) }
}

function union(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])]
}

/**
 * FIFO with per-entry merging (spec §12): a later op for a still-queued entry folds into
 * the existing op at its original position, resetting attempts and bumping rev. A delete
 * of a queued insert simply drops the op — the entry never reached the server.
 */
export function mergeOp(queue: readonly OutboxOp[], op: NewOp, now: number): OutboxOp[] {
  const existing = queue.find((o) => o.id === op.id)
  if (!existing) return [...queue, { ...op, createdAt: now, attempts: 0, rev: 0 }]
  if (existing.type === 'delete' || op.type === 'insert') return [...queue]
  if (op.type === 'delete' && existing.type === 'insert') {
    return queue.filter((o) => o.id !== op.id)
  }
  const meta: Meta = { ...pickMeta(existing), attempts: 0, rev: existing.rev + 1 }
  const merged: OutboxOp =
    op.type === 'delete'
      ? { ...meta, type: 'delete', patch: op.patch, removePaths: union(pathsOf(existing), op.removePaths) }
      : existing.type === 'insert'
        ? { ...meta, type: 'insert', row: { ...existing.row, ...op.patch }, ...photoOf(existing, op) }
        : {
            ...meta,
            type: 'update',
            patch: { ...existing.patch, ...op.patch },
            removePaths: union(existing.removePaths, op.removePaths),
            ...photoOf(existing, op),
          }
  return queue.map((o) => (o.id === op.id ? merged : o))
}

function pickMeta(op: OutboxOp): Meta {
  return {
    id: op.id,
    groupId: op.groupId,
    profileId: op.profileId,
    createdAt: op.createdAt,
    attempts: op.attempts,
    rev: op.rev,
  }
}

function pathsOf(op: OutboxOp): string[] {
  return op.type === 'insert' ? [] : op.removePaths
}

/** A new photo replaces the queued one; a patch that nulls photo_path clears it. */
function photoOf(
  existing: InsertOp | UpdateOp,
  op: Omit<UpdateOp, 'createdAt' | 'attempts' | 'rev'>,
): { photo?: OpPhoto } {
  if (op.photo) return { photo: op.photo }
  if ('photo_path' in op.patch) return {}
  return existing.photo ? { photo: existing.photo } : {}
}
