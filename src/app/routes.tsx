import type { ReactNode } from 'react'
import { Hoje } from '@/screens/hoje/Hoje'
import { STRINGS } from '@/lib/strings'

export type TabRoute = {
  path: string
  label: string
  icon: string
  element: ReactNode
}

/**
 * The single source of truth for both routing and the tab bar.
 * Later milestones add Ranking, Historico and Perfil by appending here.
 */
export const TAB_ROUTES: TabRoute[] = [
  { path: '/hoje', label: STRINGS.nav.hoje, icon: '💧', element: <Hoje /> },
]
