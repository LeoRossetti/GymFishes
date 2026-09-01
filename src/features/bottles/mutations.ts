import { supabase } from '@/lib/supabase'
import type { Bottle } from './queries'

export async function createBottle(
  profileId: string,
  input: { name: string; volume_ml: number; emoji: string | null },
): Promise<Bottle> {
  const { data, error } = await supabase
    .from('bottles')
    .insert({ profile_id: profileId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateBottle(
  id: string,
  patch: { name?: string; volume_ml?: number; emoji?: string | null },
): Promise<void> {
  const { error } = await supabase.from('bottles').update(patch).eq('id', id)
  if (error) throw error
}

export async function archiveBottle(id: string): Promise<void> {
  const { error } = await supabase
    .from('bottles')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
