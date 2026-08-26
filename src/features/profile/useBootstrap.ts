import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Bootstrap = {
  profile: { id: string; display_name: string; fish_variant: string; accent: string } | null
  groupId: string | null
}

export function useBootstrap(userId: string | undefined) {
  return useQuery<Bootstrap>({
    queryKey: ['bootstrap', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, fish_variant, accent')
        .eq('id', userId!)
        .maybeSingle()
      if (profileError) throw profileError

      const { data: membership, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', userId!)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (memberError) throw memberError

      return { profile, groupId: membership?.group_id ?? null }
    },
  })
}
