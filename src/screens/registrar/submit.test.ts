import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest'
import { waitFor } from '@testing-library/react'
import { submitDraft, type SubmitDeps } from './submit'
import { draftReducer, emptyDraft, type Draft } from './draft'
import type { Entry } from '@/features/entries/cache'

const photos = vi.hoisted(() => ({
  uploadEntryPhoto: vi.fn(),
  removeEntryPhotos: vi.fn(),
}))
vi.mock('@/features/entries/photos', () => photos)

function deps(): SubmitDeps & {
  insert: Mock<SubmitDeps['insert']>
  update: Mock<SubmitDeps['update']>
  toast: Mock<SubmitDeps['toast']>
} {
  return {
    userId: 'u1',
    groupId: 'g1',
    insert: vi.fn<SubmitDeps['insert']>(),
    update: vi.fn<SubmitDeps['update']>(),
    toast: vi.fn<SubmitDeps['toast']>(),
  }
}

const now = new Date('2026-09-01T12:00:00Z')

function withLoose(ml: number): Draft {
  return draftReducer(emptyDraft(now), { type: 'pill', amount: ml })
}

const photoDraft: Draft = {
  ...withLoose(300),
  photo: { blob: new Blob(['p']), thumb: new Blob(['t']), previewUrl: 'blob:x' },
}

describe('submitDraft', () => {
  beforeEach(() => {
    photos.uploadEntryPhoto.mockReset()
    photos.removeEntryPhotos.mockReset()
  })

  it('inserts a plain register synchronously', () => {
    const d = deps()
    submitDraft(d, withLoose(300), undefined)
    expect(d.insert).toHaveBeenCalledTimes(1)
    expect(d.insert.mock.calls[0]?.[0].totalMl).toBe(300)
  })

  it('uploads first, then inserts with the returned paths', async () => {
    photos.uploadEntryPhoto.mockResolvedValue({ photoPath: 'g1/u1/x.jpg', thumbPath: 'g1/u1/x_thumb.jpg' })
    const d = deps()
    submitDraft(d, photoDraft, undefined)
    await waitFor(() => expect(d.insert).toHaveBeenCalled())
    expect(d.insert.mock.calls[0]?.[0].photoPath).toBe('g1/u1/x.jpg')
  })

  it('falls back to a photo-less register when the upload fails', async () => {
    photos.uploadEntryPhoto.mockRejectedValue(new Error('down'))
    const d = deps()
    submitDraft(d, photoDraft, undefined)
    await waitFor(() => expect(d.insert).toHaveBeenCalled())
    expect(d.insert.mock.calls[0]?.[0].photoPath).toBeNull()
    expect(d.toast).toHaveBeenCalledWith('Não foi possível usar essa imagem.')
  })

  it('clears paths in the patch when the photo was removed in edit', () => {
    const entry = { id: 'e1', photo_path: 'g1/u1/e1.jpg', thumb_path: 'g1/u1/e1_thumb.jpg' } as Entry
    const d = deps()
    submitDraft(d, { ...withLoose(300), photoRemoved: true }, entry)
    expect(d.update.mock.calls[0]?.[0].patch.photo_path).toBeNull()
    expect(d.update.mock.calls[0]?.[0].patch.thumb_path).toBeNull()
  })

  it('removes storage objects only once the row update succeeds (row wins)', () => {
    const entry = { id: 'e1', photo_path: 'g1/u1/e1.jpg', thumb_path: 'g1/u1/e1_thumb.jpg' } as Entry
    const d = deps()
    submitDraft(d, { ...withLoose(300), photoRemoved: true }, entry)
    expect(photos.removeEntryPhotos).not.toHaveBeenCalled()
    d.update.mock.calls[0]?.[1]?.onSuccess?.()
    expect(photos.removeEntryPhotos).toHaveBeenCalledWith(['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'])
  })

  it('edit with a new photo uploads first, then updates with the returned paths', async () => {
    photos.uploadEntryPhoto.mockResolvedValue({ photoPath: 'g1/u1/e1.jpg', thumbPath: 'g1/u1/e1_thumb.jpg' })
    const entry = { id: 'e1', photo_path: null, thumb_path: null } as Entry
    const d = deps()
    submitDraft(d, photoDraft, entry)
    await waitFor(() => expect(d.update).toHaveBeenCalled())
    expect(d.update.mock.calls[0]?.[0].patch.photo_path).toBe('g1/u1/e1.jpg')
    expect(d.update.mock.calls[0]?.[0].patch.thumb_path).toBe('g1/u1/e1_thumb.jpg')
  })

  it('edit with a failing photo upload updates without touching photo fields', async () => {
    photos.uploadEntryPhoto.mockRejectedValue(new Error('down'))
    const entry = { id: 'e1', photo_path: 'g1/u1/old.jpg', thumb_path: 'g1/u1/old_thumb.jpg' } as Entry
    const d = deps()
    submitDraft(d, photoDraft, entry)
    await waitFor(() => expect(d.update).toHaveBeenCalled())
    expect(d.toast).toHaveBeenCalledWith('Não foi possível usar essa imagem.')
    const patch = d.update.mock.calls[0]?.[0].patch
    expect(patch).not.toHaveProperty('photo_path')
    expect(patch).not.toHaveProperty('thumb_path')
  })

  it('a plain edit leaves photo fields out of the patch entirely', () => {
    const entry = { id: 'e1', photo_path: 'g1/u1/e1.jpg', thumb_path: 'g1/u1/e1_thumb.jpg' } as Entry
    const d = deps()
    submitDraft(d, withLoose(300), entry)
    expect(d.update).toHaveBeenCalledTimes(1)
    const patch = d.update.mock.calls[0]?.[0].patch
    expect(patch).not.toHaveProperty('photo_path')
    expect(patch).not.toHaveProperty('thumb_path')
  })
})
