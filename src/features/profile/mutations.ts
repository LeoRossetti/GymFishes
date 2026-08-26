import { supabase } from '@/lib/supabase'

export async function createProfile(id: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .insert({ id, display_name: displayName.trim() })
  if (error) throw error
}
