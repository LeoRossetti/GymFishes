import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

export type Bottle = Tables<'bottles'>

export function useBottles(userId: string | undefined) {
  return useQuery({
    queryKey: ['bottles', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Bottle[]> => {
      const { data, error } = await supabase
        .from('bottles')
        .select('*')
        .eq('profile_id', userId!)
        .is('archived_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}
