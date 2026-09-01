import type { Tables } from '@/lib/database.types'

export type Entry = Tables<'entries'>

export const entriesKey = (groupId: string) => ['entries', groupId] as const

/** Insert or replace by id, newest-first by drank_at; soft-deleted rows are dropped. */
export function upsertEntry(list: readonly Entry[], entry: Entry): Entry[] {
  const rest = list.filter((e) => e.id !== entry.id)
  if (entry.deleted_at) return rest
  const at = rest.findIndex((e) => Date.parse(e.drank_at) <= Date.parse(entry.drank_at))
  return at === -1 ? [...rest, entry] : [...rest.slice(0, at), entry, ...rest.slice(at)]
}

export function removeEntry(list: readonly Entry[], id: string): Entry[] {
  return list.filter((e) => e.id !== id)
}
