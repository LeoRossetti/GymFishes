import type { ReactNode } from 'react'
import { Hoje } from '@/screens/hoje/Hoje'
import { Historico } from '@/screens/historico/Historico'
import { Perfil } from '@/screens/perfil/Perfil'
import { Ranking } from '@/screens/ranking/Ranking'
import { STRINGS } from '@/lib/strings'
import { Calendar, Drop, FishIcon, Trophy } from '@/ui/icons'

export type TabRoute = {
  path: string
  label: string
  /** The tab's 26px icon; `active` fills it and thickens the stroke (spec M7 §5). */
  icon: (props: { active: boolean }) => ReactNode
  element: ReactNode
}

const look = (active: boolean) => ({ size: 26, filled: active, strokeWidth: active ? 2.4 : 2 })

/**
 * The single source of truth for both routing and the tab bar.
 * Later milestones add tabs by appending here.
 */
export const TAB_ROUTES: TabRoute[] = [
  {
    path: '/hoje',
    label: STRINGS.nav.hoje,
    icon: ({ active }) => <Drop {...look(active)} />,
    element: <Hoje />,
  },
  {
    path: '/ranking',
    label: STRINGS.nav.ranking,
    icon: ({ active }) => <Trophy {...look(active)} />,
    element: <Ranking />,
  },
  {
    path: '/historico',
    label: STRINGS.nav.historico,
    icon: ({ active }) => <Calendar {...look(active)} />,
    element: <Historico />,
  },
  {
    path: '/perfil',
    label: STRINGS.nav.perfil,
    icon: ({ active }) => <FishIcon {...look(active)} />,
    element: <Perfil />,
  },
]
