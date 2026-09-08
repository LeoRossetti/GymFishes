import type { ReactNode } from 'react'
import { Hoje } from '@/screens/hoje/Hoje'
import { Perfil } from '@/screens/perfil/Perfil'
import { Ranking } from '@/screens/ranking/Ranking'
import { STRINGS } from '@/lib/strings'

export type TabRoute = {
  path: string
  label: string
  icon: string
  element: ReactNode
}

/**
 * The single source of truth for both routing and the tab bar.
 * Later milestones add tabs by appending here.
 */
export const TAB_ROUTES: TabRoute[] = [
  { path: '/hoje', label: STRINGS.nav.hoje, icon: '💧', element: <Hoje /> },
  { path: '/ranking', label: STRINGS.nav.ranking, icon: '🏆', element: <Ranking /> },
  { path: '/perfil', label: STRINGS.nav.perfil, icon: '🐠', element: <Perfil /> },
]
