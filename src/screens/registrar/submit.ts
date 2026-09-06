import type { Entry } from '@/features/entries/cache'
import type { EntryPatch, NewEntry } from '@/features/entries/mutations'
import { removeEntryPhotos, uploadEntryPhoto } from '@/features/entries/photos'
import { totalMl } from '@/lib/composition'
import { STRINGS } from '@/lib/strings'
import { draftItems, type Draft } from './draft'

export type SubmitDeps = {
  userId: string
  groupId: string
  insert: (input: NewEntry) => void
  update: (vars: { id: string; patch: EntryPatch }, opts?: { onSuccess?: () => void }) => void
  toast: (msg: string) => void
}

/**
 * Fire-and-forget by design: the sheet closes before any network work happens
 * (spec §5.2). M3's outbox replaces the upload-then-write chain with a durable queue.
 */
export function submitDraft(deps: SubmitDeps, draft: Draft, entry: Entry | undefined): void {
  const items = draftItems(draft)
  const total = totalMl(items)
  const note = draft.note.trim() || null

  if (entry) {
    const base: EntryPatch = {
      total_ml: total,
      composition: items as Entry['composition'],
      note,
      drank_at: draft.drankAt.toISOString(),
    }
    if (draft.photo) {
      const { blob, thumb } = draft.photo
      void uploadEntryPhoto(deps.groupId, deps.userId, entry.id, blob, thumb)
        .then(({ photoPath, thumbPath }) =>
          deps.update({ id: entry.id, patch: { ...base, photo_path: photoPath, thumb_path: thumbPath } }),
        )
        .catch(() => {
          deps.toast(STRINGS.registrar.fotoErro)
          deps.update({ id: entry.id, patch: base })
        })
    } else if (draft.photoRemoved) {
      // row wins: only drop the storage objects once the patch actually lands (spec §13
      // step 7). The onSuccess cleanup below is best-effort — the sheet is typically
      // unmounted by the time the update settles, so it may never run; the storage objects
      // are then simply orphaned, which spec §13 step 7 accepts. What must never happen is
      // removing objects still referenced by the row, which is why cleanup only ever
      // follows a successful update, never precedes or races it.
      deps.update(
        { id: entry.id, patch: { ...base, photo_path: null, thumb_path: null } },
        { onSuccess: () => removeEntryPhotos([entry.photo_path, entry.thumb_path]) },
      )
    } else {
      deps.update({ id: entry.id, patch: base })
    }
    return
  }

  const input: NewEntry = {
    id: crypto.randomUUID(),
    profileId: deps.userId,
    totalMl: total,
    composition: items,
    note,
    drankAt: draft.drankAt,
    photoPath: null,
    thumbPath: null,
  }
  if (draft.photo) {
    const { blob, thumb } = draft.photo
    void uploadEntryPhoto(deps.groupId, deps.userId, input.id, blob, thumb)
      .then(({ photoPath, thumbPath }) => deps.insert({ ...input, photoPath, thumbPath }))
      .catch(() => {
        deps.toast(STRINGS.registrar.fotoErro)
        deps.insert(input)
      })
  } else {
    deps.insert(input)
  }
}
