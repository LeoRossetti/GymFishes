import { supabase } from '@/lib/supabase'
import { STRINGS } from '@/lib/strings'
import { generateInviteCode, normalizeInviteCode } from './inviteCode'

const UNIQUE_VIOLATION = '23505'

export async function createGroup(name: string, profileId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        invite_code: generateInviteCode(),
        created_by: profileId,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === UNIQUE_VIOLATION) continue
      throw error
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, profile_id: profileId })
    if (memberError) throw memberError

    return data.id
  }
  throw new Error(STRINGS.grupo.codigoFalhou)
}

export async function joinGroup(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group', {
    code: normalizeInviteCode(code),
  })
  if (error) throw error
  return data
}
