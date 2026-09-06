import { describe, expect, it } from 'vitest'
import type { TablesInsert } from '@/lib/database.types'
import {
  backoffMs,
  isFailed,
  MAX_ATTEMPTS,
  mergeOp,
  statusOf,
  type NewOp,
  type OutboxOp,
} from './outbox'

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

function enqueue(queue: readonly OutboxOp[], op: NewOp, now = 1000): OutboxOp[] {
  return mergeOp(queue, op, now)
}

describe('mergeOp', () => {
  it('appends a new op with attempts 0 and rev 0', () => {
    const q = enqueue([], insertOp)
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ type: 'insert', id: 'e1', createdAt: 1000, attempts: 0, rev: 0 })
  })

  it('keeps FIFO: later ops for other entries append after earlier ones', () => {
    const q = enqueue(enqueue([], insertOp, 1000), { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } }, 2000)
    expect(q.map((o) => o.id)).toEqual(['e1', 'e2'])
  })

  it('folds an update into a queued insert, keeping position and bumping rev', () => {
    const q0 = enqueue(enqueue([], insertOp, 1000), { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } }, 2000)
    const q = enqueue(q0, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] }, 3000)
    expect(q.map((o) => o.id)).toEqual(['e1', 'e2'])
    expect(q[0]).toMatchObject({ type: 'insert', createdAt: 1000, rev: 1 })
    expect(q[0]?.type === 'insert' && q[0].row.total_ml).toBe(900)
  })

  it('merges consecutive updates: patches shallow-merge, removePaths union', () => {
    const base = enqueue([], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 700 }, removePaths: ['a.jpg'] })
    const q = enqueue(base, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { note: 'oi' }, removePaths: ['a.jpg', 'b.jpg'] })
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ type: 'update', rev: 1, patch: { total_ml: 700, note: 'oi' }, removePaths: ['a.jpg', 'b.jpg'] })
  })

  it('a new photo replaces the queued one; a patch nulling photo_path clears it', () => {
    const photo1 = { photo: new Blob(['1']), thumb: new Blob(['1t']) }
    const photo2 = { photo: new Blob(['2']), thumb: new Blob(['2t']) }
    const withPhoto = enqueue([], { ...insertOp, photo: photo1 })
    const replaced = enqueue(withPhoto, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: {}, photo: photo2, removePaths: [] })
    expect(replaced[0]?.type === 'insert' && replaced[0].photo).toBe(photo2)
    const cleared = enqueue(withPhoto, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { photo_path: null, thumb_path: null }, removePaths: [] })
    expect(cleared[0]?.type === 'insert' && cleared[0].photo).toBeUndefined()
  })

  it('a delete of a queued insert drops the op entirely — the entry never reached the server', () => {
    const q = enqueue(enqueue([], insertOp), { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: [] })
    expect(q).toEqual([])
  })

  it('a delete of a queued update becomes a delete, keeping removePaths', () => {
    const base = enqueue([], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 700 }, removePaths: ['a.jpg'] })
    const q = enqueue(base, { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: ['b.jpg'] })
    expect(q[0]).toMatchObject({ type: 'delete', rev: 1, patch: { deleted_at: 'x' }, removePaths: ['a.jpg', 'b.jpg'] })
  })

  it('merging resets attempts so an edited op earns fresh tries', () => {
    const failed = { ...enqueue([], insertOp)[0]!, attempts: MAX_ATTEMPTS }
    const q = enqueue([failed], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] })
    expect(q[0]?.attempts).toBe(0)
  })

  it('anything after a queued delete is ignored', () => {
    const del = enqueue([], { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: [] })
    const q = enqueue(del, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 1 }, removePaths: [] })
    expect(q).toEqual(del)
  })
})

describe('backoffMs', () => {
  it('doubles per attempt and caps at 60 s', () => {
    expect(backoffMs(1)).toBe(2000)
    expect(backoffMs(2)).toBe(4000)
    expect(backoffMs(4)).toBe(16000)
    expect(backoffMs(10)).toBe(60000)
  })
})

describe('statusOf / isFailed', () => {
  it('splits ids into pending and failed; queued is the union', () => {
    const ok = enqueue([], insertOp)[0]!
    const bad = { ...enqueue([], { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })[0]!, attempts: MAX_ATTEMPTS }
    expect(isFailed(ok)).toBe(false)
    expect(isFailed(bad)).toBe(true)
    const s = statusOf([ok, bad])
    expect([...s.pending]).toEqual(['e1'])
    expect([...s.failed]).toEqual(['e2'])
    expect([...s.queued].sort()).toEqual(['e1', 'e2'])
  })
})
