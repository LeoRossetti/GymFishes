import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'
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
 * rows — that is what makes deletions sync. Ordered ascending so the newest lands last.
 */
export async function fetchEntriesSince(groupId: string, since: string | undefined): Promise<Entry[]> {
  let query = supabase.from('entries').select('*').eq('group_id', groupId)
  if (since !== undefined) query = query.gt('updated_at', since)
  const { data, error } = await query.order('updated_at', { ascending: true })
  if (error) throw error
  return data
}

/** Entry ids are client-generated, so a re-sent insert is an idempotent upsert (spec §12). */
export async function upsertEntryRow(row: TablesInsert<'entries'>): Promise<void> {
  const { error } = await supabase.from('entries').upsert(row)
  if (error) throw error
}
