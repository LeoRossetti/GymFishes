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

/**
 * Newest server-authored change in the mirror — the incremental-sync watermark.
 * Optimistic rows carry `updated_at: ''` and never advance it, so client clocks can't
 * hide server rows. Compared as strings on purpose: values round-trip to the server
 * verbatim, keeping microsecond precision that Date.parse would drop.
 */
export function watermarkOf(list: readonly Entry[]): string | undefined {
  let max: string | undefined
  for (const e of list) {
    if (e.updated_at !== '' && (max === undefined || e.updated_at > max)) max = e.updated_at
  }
  return max
}

/** Server rows merge into the mirror; rows with a queued op keep their optimistic state. */
export function mergeEntries(
  list: readonly Entry[],
  rows: readonly Entry[],
  queued: ReadonlySet<string>,
): Entry[] {
  let next: readonly Entry[] = list
  for (const row of rows) {
    if (queued.has(row.id)) continue
    next = upsertEntry(next, row)
  }
  return next as Entry[]
}
