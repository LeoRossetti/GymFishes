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
  /** The tab's icon; `active` fills it and thickens the stroke (spec M7 §5). */
  icon: (props: { active: boolean }) => ReactNode
  element: ReactNode
}

const weight = (active: boolean) => (active ? 2.4 : 2)

/**
 * The single source of truth for both routing and the tab bar.
 * Later milestones add tabs by appending here.
 */
export const TAB_ROUTES: TabRoute[] = [
  {
    path: '/hoje',
    label: STRINGS.nav.hoje,
    icon: ({ active }) => <Drop filled={active} strokeWidth={weight(active)} />,
    element: <Hoje />,
  },
  {
    path: '/ranking',
    label: STRINGS.nav.ranking,
    icon: ({ active }) => <Trophy filled={active} strokeWidth={weight(active)} />,
    element: <Ranking />,
  },
  {
    path: '/historico',
    label: STRINGS.nav.historico,
    icon: ({ active }) => <Calendar filled={active} strokeWidth={weight(active)} />,
    element: <Historico />,
  },
  {
    path: '/perfil',
    label: STRINGS.nav.perfil,
    icon: ({ active }) => <FishIcon filled={active} strokeWidth={weight(active)} />,
    element: <Perfil />,
  },
]
