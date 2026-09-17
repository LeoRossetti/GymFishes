import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSession } from '@/features/auth/AuthProvider'
import { STRINGS } from '@/lib/strings'

/** Sends an already-authenticated user away from /entrar and /criar-conta. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="text-[20px] font-extrabold text-ink-2">{STRINGS.app.nome}</p>
      </div>
    )
  }
  if (session) return <Navigate to="/hoje" replace />
  return children
}
