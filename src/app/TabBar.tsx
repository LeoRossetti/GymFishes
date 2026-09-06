import { NavLink } from 'react-router'
import { TAB_ROUTES, type TabRoute } from './routes'
import { STRINGS } from '@/lib/strings'

function Tab({ route }: { route: TabRoute }) {
  return (
    <NavLink
      to={route.path}
      className={({ isActive }) =>
        `flex-1 text-center text-[9px] font-bold ${isActive ? 'text-water' : 'text-ink-3'}`
      }
    >
      <span className="mb-0.5 block text-[15px]">{route.icon}</span>
      {route.label}
    </NavLink>
  )
}

export function TabBar({ onRegister }: { onRegister: () => void }) {
  const half = Math.ceil(TAB_ROUTES.length / 2)
  const left = TAB_ROUTES.slice(0, half)
  const right = TAB_ROUTES.slice(half)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 mx-auto flex max-w-[430px] items-center
                 border-t border-line bg-bg pt-2"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      {left.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
      <div className="flex-1 text-center">
        <button
          type="button"
          aria-label={STRINGS.nav.registrarAgua}
          onClick={onRegister}
          className="mx-auto -mt-3.5 block h-11 w-11 rounded-full border-b-[3px]
                     border-water-edge bg-water text-[19px] font-extrabold text-ink-on-water"
        >
          +
        </button>
      </div>
      {right.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
    </nav>
  )
}
