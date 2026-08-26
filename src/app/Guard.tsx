import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'

export function Guard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const bootstrap = useBootstrap(session?.user.id)
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/entrar" replace />
  if (bootstrap.isLoading) return null

  const incomplete = !bootstrap.data?.profile || !bootstrap.data.groupId
  if (incomplete && location.pathname !== '/inicio') {
    return <Navigate to="/inicio" replace />
  }
  if (!incomplete && location.pathname === '/inicio') {
    return <Navigate to="/hoje" replace />
  }
  return children
}
