import type { Entry } from '@/features/entries/cache'
import type { EntryOps, EntryPatch } from '@/features/entries/mutations'
import type { OpPhoto } from '@/features/entries/outbox'
import { totalMl } from '@/lib/composition'
import { draftItems, type Draft } from './draft'

/**
 * Submitting is now a pure local enqueue — uploads and retries live in the outbox
 * flusher — so the sheet closes instantly whatever the connectivity (spec §5.2/§12).
 */
export function submitDraft(
  ops: Pick<EntryOps, 'insert' | 'update'>,
  userId: string,
  draft: Draft,
  entry: Entry | undefined,
): void {
  const items = draftItems(draft)
  const note = draft.note.trim() || null
  const photo: OpPhoto | undefined = draft.photo
    ? { photo: draft.photo.blob, thumb: draft.photo.thumb }
    : undefined

  if (entry) {
    const patch: EntryPatch = {
      total_ml: totalMl(items),
      composition: items as Entry['composition'],
      note,
      drank_at: draft.drankAt.toISOString(),
      ...(draft.photoRemoved ? { photo_path: null, thumb_path: null } : {}),
    }
    ops.update(entry, patch, photo)
    return
  }

  ops.insert({
    id: crypto.randomUUID(),
    profileId: userId,
    totalMl: totalMl(items),
    composition: items,
    note,
    drankAt: draft.drankAt,
    photo: photo ?? null,
  })
}
