import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CompositionItem } from '@/lib/composition'
import { dayKey } from '@/lib/dates'
import type { TablesInsert } from '@/lib/database.types'
import { insertEntry, updateEntry, type EntryPatch } from './api'
import { entriesKey, upsertEntry, type Entry } from './cache'

export type { EntryPatch }

export type NewEntry = {
  id: string
  profileId: string
  totalMl: number
  composition: CompositionItem[]
  note: string | null
  drankAt: Date
  photoPath: string | null
  thumbPath: string | null
}

function toRow(input: NewEntry, groupId: string): TablesInsert<'entries'> {
  return {
    id: input.id,
    profile_id: input.profileId,
    group_id: groupId,
    total_ml: input.totalMl,
    composition: input.composition as TablesInsert<'entries'>['composition'],
    note: input.note,
    photo_path: input.photoPath,
    thumb_path: input.thumbPath,
    drank_at: input.drankAt.toISOString(),
    // drank_on omitted: DB default + trigger own it
  }
}

function optimisticRow(input: NewEntry, groupId: string): Entry {
  const now = new Date().toISOString()
  return {
    ...toRow(input, groupId),
    composition: input.composition as Entry['composition'],
    note: input.note,
    photo_path: input.photoPath,
    thumb_path: input.thumbPath,
    drank_on: dayKey(input.drankAt),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  } as Entry
}

async function snapshot(client: QueryClient, groupId: string): Promise<Entry[]> {
  await client.cancelQueries({ queryKey: entriesKey(groupId) })
  return client.getQueryData<Entry[]>(entriesKey(groupId)) ?? []
}

export function useInsertEntry(groupId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewEntry) => insertEntry(toRow(input, groupId)),
    onMutate: async (input) => {
      const before = await snapshot(client, groupId)
      client.setQueryData(entriesKey(groupId), upsertEntry(before, optimisticRow(input, groupId)))
      return { before }
    },
    onError: (_e, _input, ctx) => {
      if (ctx) client.setQueryData(entriesKey(groupId), ctx.before)
    },
    onSettled: () => client.invalidateQueries({ queryKey: entriesKey(groupId) }),
  })
}

export function useUpdateEntry(groupId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EntryPatch }) => updateEntry(id, patch),
    onMutate: async ({ id, patch }) => {
      const before = await snapshot(client, groupId)
      const row = before.find((e) => e.id === id)
      if (row) {
        const merged = {
          ...row,
          ...patch,
          drank_on: patch.drank_at ? dayKey(new Date(patch.drank_at)) : row.drank_on,
          updated_at: new Date().toISOString(),
        }
        client.setQueryData(entriesKey(groupId), upsertEntry(before, merged))
      }
      return { before }
    },
    onError: (_e, _input, ctx) => {
      if (ctx) client.setQueryData(entriesKey(groupId), ctx.before)
    },
    onSettled: () => client.invalidateQueries({ queryKey: entriesKey(groupId) }),
  })
}
