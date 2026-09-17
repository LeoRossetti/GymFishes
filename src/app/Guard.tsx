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
  if (bootstrap.isLoading) return coldStart

  if (bootstrap.isError && !bootstrap.data) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="mb-6 text-[15px] text-ink-2">{STRINGS.erro.generico}</p>
        <Button onClick={() => bootstrap.refetch()}>{STRINGS.erro.recarregar}</Button>
      </div>
    )
  }

  const incomplete = !bootstrap.data?.profile || !bootstrap.data.groupId
  if (incomplete && location.pathname !== '/inicio') {
    return <Navigate to="/inicio" replace />
  }
  if (!incomplete && location.pathname === '/inicio') {
    return <Navigate to="/hoje" replace />
  }
  return children
}
