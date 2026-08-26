import { supabase } from '@/lib/supabase'

export async function createProfile(id: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, display_name: displayName.trim() }, { onConflict: 'id' })
  if (error) throw error
}
