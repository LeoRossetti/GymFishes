import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSession } from '@/features/auth/AuthProvider'

/** Sends an already-authenticated user away from /entrar and /criar-conta. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  if (loading) return null
  if (session) return <Navigate to="/hoje" replace />
  return children
}
