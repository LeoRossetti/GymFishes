import { useMemo } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CompositionItem } from '@/lib/composition'
import { dayKey } from '@/lib/dates'
import type { TablesInsert } from '@/lib/database.types'
import type { EntryPatch } from './api'
import { entriesKey, removeEntry, upsertEntry, type Entry } from './cache'
import { flushOutbox } from './flush'
import type { NewOp, OpPhoto } from './outbox'
import { outboxStore } from './outboxStore'

export type { EntryPatch }

export type NewEntry = {
  id: string
  profileId: string
  totalMl: number
  composition: CompositionItem[]
  note: string | null
  drankAt: Date
  photo: OpPhoto | null
}

function toRow(input: NewEntry, groupId: string): TablesInsert<'entries'> {
  return {
    id: input.id,
    profile_id: input.profileId,
    group_id: groupId,
    total_ml: input.totalMl,
    composition: input.composition as TablesInsert<'entries'>['composition'],
    note: input.note,
    drank_at: input.drankAt.toISOString(),
    // photo_path/thumb_path omitted: the flusher fills them in after the upload
    // drank_on omitted: DB default + trigger own it
  }
}

/** updated_at '' marks the row optimistic: the sync watermark ignores it (cache.watermarkOf). */
function optimisticRow(input: NewEntry, groupId: string): Entry {
  return {
    ...toRow(input, groupId),
    composition: input.composition as Entry['composition'],
    note: input.note,
    photo_path: null,
    thumb_path: null,
    drank_on: dayKey(input.drankAt),
    created_at: new Date().toISOString(),
    updated_at: '',
    deleted_at: null,
  } as Entry
}

async function patchAndEnqueue(
  client: QueryClient,
  groupId: string,
  apply: (list: readonly Entry[]) => Entry[],
  op: NewOp,
): Promise<void> {
  await client.cancelQueries({ queryKey: entriesKey(groupId) })
  const list = client.getQueryData<Entry[]>(entriesKey(groupId)) ?? []
  client.setQueryData(entriesKey(groupId), apply(list))
  await outboxStore.enqueue(op)
  void flushOutbox(client)
}

function storagePaths(entry: Entry): string[] {
  return [entry.photo_path, entry.thumb_path].filter((p): p is string => p !== null)
}

/**
 * The write path (spec §12): patch the cache, enqueue the op, kick a flush. Writes never
 * fail at call time — delivery is the outbox's job, and failures surface as row state.
 */
export function useEntryOps(groupId: string, profileId: string) {
  const client = useQueryClient()
  return useMemo(
    () => ({
      insert(input: NewEntry): void {
        void patchAndEnqueue(client, groupId, (l) => upsertEntry(l, optimisticRow(input, groupId)), {
          type: 'insert',
          id: input.id,
          groupId,
          profileId,
          row: toRow(input, groupId),
          ...(input.photo ? { photo: input.photo } : {}),
        })
      },
      update(entry: Entry, patch: EntryPatch, photo?: OpPhoto): void {
        const removePaths = patch.photo_path === null ? storagePaths(entry) : []
        void patchAndEnqueue(
          client,
          groupId,
          (l) => {
            const row = l.find((e) => e.id === entry.id)
            if (!row) return [...l]
            return upsertEntry(l, {
              ...row,
              ...patch,
              drank_on: patch.drank_at ? dayKey(new Date(patch.drank_at)) : row.drank_on,
              updated_at: '',
            })
          },
          { type: 'update', id: entry.id, groupId, profileId, patch, removePaths, ...(photo ? { photo } : {}) },
        )
      },
      remove(entry: Entry): void {
        void patchAndEnqueue(client, groupId, (l) => removeEntry(l, entry.id), {
          type: 'delete',
          id: entry.id,
          groupId,
          profileId,
          patch: { deleted_at: new Date().toISOString() },
          removePaths: storagePaths(entry),
        })
      },
      retry(entryId: string): void {
        void outboxStore.retry(entryId).then(() => flushOutbox(client))
      },
    }),
    [client, groupId, profileId],
  )
}

export type EntryOps = ReturnType<typeof useEntryOps>
