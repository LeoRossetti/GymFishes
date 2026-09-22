import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'
import { fetchAllPages } from './sync'
import type { Entry } from './cache'

export type EntryPatch = Partial<
  Pick<Entry, 'total_ml' | 'composition' | 'note' | 'drank_at' | 'photo_path' | 'thumb_path' | 'deleted_at'>
>

export async function updateEntry(id: string, patch: EntryPatch): Promise<void> {
  const { error } = await supabase.from('entries').update(patch).eq('id', id)
  if (error) throw error
}

/**
 * Watermark read (spec §12): everything that changed since `since`, INCLUDING soft-deleted
 * rows — that is what makes deletions sync. On the first-ever sync there is nothing to
 * un-delete, so deleted rows are skipped; any newer than the resulting watermark are
 * fetched (and dropped) on the next incremental pass. Paged, because PostgREST caps at 1000.
 */
export function fetchEntriesSince(groupId: string, since: string | undefined): Promise<Entry[]> {
  return fetchAllPages(async (from, to) => {
    let query = supabase.from('entries').select('*').eq('group_id', groupId)
    query = since === undefined ? query.is('deleted_at', null) : query.gt('updated_at', since)
    const { data, error } = await query
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
    if (error) throw error
    return data
  })
}

/** Entry ids are client-generated, so a re-sent insert is an idempotent upsert (spec §12). */
export async function upsertEntryRow(row: TablesInsert<'entries'>): Promise<void> {
  const { error } = await supabase.from('entries').upsert(row)
  if (error) throw error
}
