import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

export function Guard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const bootstrap = useBootstrap(session?.user.id)
  const location = useLocation()

  const coldStart = (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <p className="text-[20px] font-extrabold text-ink-2">{STRINGS.app.nome}</p>
    </div>
  )

  if (loading) return coldStart
  if (!session) return <Navigate to="/entrar" replace />
  // isPending = no data yet, whatever the fetch status; isLoading is false for a tick after the
  // query is enabled and would send a reloading tab through onboarding.
  //
  // Offline with an empty mirror (first open, or right after a version bump) the query is
  // paused, not failing — say so instead of holding the cold-start mark forever. TanStack
  // resumes paused queries by itself when the network returns.
  const paused = bootstrap.fetchStatus === 'paused'
  if ((bootstrap.isError || paused) && !bootstrap.data) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="mb-6 text-[15px] text-ink-2">
          {paused ? STRINGS.erro.semConexao : STRINGS.erro.generico}
        </p>
        <Button onClick={() => bootstrap.refetch()}>{STRINGS.erro.recarregar}</Button>
      </div>
    )
  }
  if (bootstrap.isPending) return coldStart

  const incomplete = !bootstrap.data?.profile || !bootstrap.data.groupId
  if (incomplete && location.pathname !== '/inicio') {
    return <Navigate to="/inicio" replace />
  }
  if (!incomplete && location.pathname === '/inicio') {
    return <Navigate to="/hoje" replace />
  }
  return children
}
