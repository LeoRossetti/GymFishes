import type { ReactNode } from 'react'
import { Hoje } from '@/screens/hoje/Hoje'
import { Perfil } from '@/screens/perfil/Perfil'
import { STRINGS } from '@/lib/strings'

export type TabRoute = {
  path: string
  label: string
  icon: string
  element: ReactNode
}

/**
 * The single source of truth for both routing and the tab bar.
 * Later milestones add Ranking and Historico by appending here.
 */
export const TAB_ROUTES: TabRoute[] = [
  { path: '/hoje', label: STRINGS.nav.hoje, icon: '💧', element: <Hoje /> },
  { path: '/perfil', label: STRINGS.nav.perfil, icon: '🐠', element: <Perfil /> },
]
