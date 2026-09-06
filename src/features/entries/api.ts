import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'
import type { Entry } from './cache'

export async function fetchEntries(groupId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .order('drank_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertEntry(row: TablesInsert<'entries'>): Promise<void> {
  const { error } = await supabase.from('entries').insert(row)
  if (error) throw error
}

export type EntryPatch = Partial<
  Pick<Entry, 'total_ml' | 'composition' | 'note' | 'drank_at' | 'photo_path' | 'thumb_path' | 'deleted_at'>
>

export async function updateEntry(id: string, patch: EntryPatch): Promise<void> {
  const { error } = await supabase.from('entries').update(patch).eq('id', id)
  if (error) throw error
}
