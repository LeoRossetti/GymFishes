export type SupabaseEnv = {
  url: string
  anonKey: string
}

export function readSupabaseEnv(source: Record<string, string | undefined>): SupabaseEnv {
  const url = source.VITE_SUPABASE_URL
  const anonKey = source.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local',
    )
  }
  return { url, anonKey }
}
