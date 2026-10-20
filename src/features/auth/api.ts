import { supabase } from '@/lib/supabase'

/** The three auth calls the screens make, so no component touches the client (CLAUDE.md). */
export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}
