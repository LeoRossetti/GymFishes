import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Member = {
  id: string
  display_name: string
  fish_variant: string
  accent: string
  joined_at: string
}

export function useMembers(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ['members', groupId],
    enabled: Boolean(groupId),
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('joined_at, profiles(id, display_name, fish_variant, accent)')
        .eq('group_id', groupId!)
        .order('joined_at', { ascending: true })
      if (error) throw error
      return data.flatMap((row) =>
        row.profiles ? [{ ...row.profiles, joined_at: row.joined_at }] : [],
      )
    },
  })
}

export type Group = { id: string; name: string; invite_code: string }

export function useGroup(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    enabled: Boolean(groupId),
    queryFn: async (): Promise<Group | null> => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, invite_code')
        .eq('id', groupId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
