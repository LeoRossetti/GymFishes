import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Entry } from '@/features/entries/cache'
import { emptyDraft, type Draft } from './draft'
import { submitDraft } from './submit'

const ops = { insert: vi.fn(), update: vi.fn() }

const entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  photo_path: 'g1/u1/e1.jpg',
  thumb_path: 'g1/u1/e1_thumb.jpg',
  drank_at: '2026-09-01T11:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T11:00:00+00:00',
  updated_at: '2026-09-01T11:00:00+00:00',
  deleted_at: null,
} as Entry

function draft(overrides: Partial<Draft>): Draft {
  return { ...emptyDraft(new Date('2026-09-06T12:00:00Z')), loose: 300, ...overrides }
}

describe('submitDraft', () => {
  beforeEach(() => {
    ops.insert.mockReset()
    ops.update.mockReset()
  })

  it('inserts a new entry with a generated id and no photo', () => {
    submitDraft(ops, 'u1', draft({}), undefined)
    expect(ops.insert).toHaveBeenCalledTimes(1)
    const input = ops.insert.mock.calls[0]?.[0]
    expect(input.id).toMatch(/[0-9a-f-]{36}/)
    expect(input).toMatchObject({ profileId: 'u1', totalMl: 300, note: null, photo: null })
  })

  it('carries the photo blobs on the insert', () => {
    const blob = new Blob(['p'])
    const thumb = new Blob(['t'])
    submitDraft(ops, 'u1', draft({ photo: { blob, thumb, previewUrl: 'blob:x' } }), undefined)
    expect(ops.insert.mock.calls[0]?.[0].photo).toEqual({ photo: blob, thumb })
  })

  it('updates an existing entry with the recomputed patch', () => {
    submitDraft(ops, 'u1', draft({ note: ' oi ' }), entry)
    expect(ops.update).toHaveBeenCalledTimes(1)
    const [target, patch, photo] = ops.update.mock.calls[0]!
    expect(target).toBe(entry)
    expect(patch).toMatchObject({ total_ml: 300, note: 'oi' })
    expect('photo_path' in patch).toBe(false)
    expect(photo).toBeUndefined()
  })

  it('photoRemoved nulls the paths in the patch', () => {
    submitDraft(ops, 'u1', draft({ photoRemoved: true }), entry)
    const patch = ops.update.mock.calls[0]?.[1]
    expect(patch.photo_path).toBeNull()
    expect(patch.thumb_path).toBeNull()
  })

  it('a replacement photo travels as the third argument', () => {
    const blob = new Blob(['p'])
    const thumb = new Blob(['t'])
    submitDraft(ops, 'u1', draft({ photo: { blob, thumb, previewUrl: 'blob:x' } }), entry)
    expect(ops.update.mock.calls[0]?.[2]).toEqual({ photo: blob, thumb })
  })
})
