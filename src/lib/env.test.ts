import { describe, expect, it } from 'vitest'
import { readSupabaseEnv } from './env'

describe('readSupabaseEnv', () => {
  it('returns both values when present', () => {
    expect(
      readSupabaseEnv({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({ url: 'http://127.0.0.1:54321', anonKey: 'anon-key' })
  })

  it('throws when the url is missing', () => {
    expect(() => readSupabaseEnv({ VITE_SUPABASE_ANON_KEY: 'anon-key' })).toThrow(
      /VITE_SUPABASE_URL/,
    )
  })

  it('throws when the key is missing', () => {
    expect(() => readSupabaseEnv({ VITE_SUPABASE_URL: 'http://x' })).toThrow(
      /VITE_SUPABASE_ANON_KEY/,
    )
  })

  it('treats an empty string as missing', () => {
    expect(() =>
      readSupabaseEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: 'k' }),
    ).toThrow()
  })
})
