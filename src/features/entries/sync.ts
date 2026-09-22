import { mergeEntries, watermarkOf, type Entry } from './cache'

export type SyncDeps = {
  groupId: string
  prev: readonly Entry[]
  queued: ReadonlySet<string>
  fetchSince: (groupId: string, since: string | undefined) => Promise<Entry[]>
}

/**
 * Incremental read sync (spec §12): fetch rows changed since the newest server timestamp
 * already in the mirror, merge by id, drop soft-deleted. The watermark is derived from
 * the mirror itself, so after a crash it can never run ahead of what was persisted.
 */
export async function runEntriesSync({ groupId, prev, queued, fetchSince }: SyncDeps): Promise<Entry[]> {
  const rows = await fetchSince(groupId, watermarkOf(prev))
  return mergeEntries(prev, rows, queued)
}

/** PostgREST silently caps a response at 1000 rows. */
export const SYNC_PAGE = 1000

/** Fetch `[from, to]` windows until a page comes back short of `pageSize`. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = SYNC_PAGE,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1)
    all.push(...page)
    if (page.length < pageSize) return all
  }
}
