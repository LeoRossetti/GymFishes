import { NavLink } from 'react-router'
import { TAB_ROUTES, type TabRoute } from './routes'
import { STRINGS } from '@/lib/strings'
import { Plus } from '@/ui/icons'

function Tab({ route }: { route: TabRoute }) {
  return (
    <NavLink
      to={route.path}
      className={({ isActive }) =>
        `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] text-[11px] font-bold
         active:bg-line transition-colors duration-100 ${isActive ? 'text-water' : 'text-ink-2'}`
      }
    >
      {({ isActive }) => (
        <>
          {route.icon({ active: isActive })}
          <span>{route.label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * Four tabs around the floating plus (spec M7 §5). A normal flex row: the shell frame places it
 * under the scroll region, so it is never `position: fixed`. The bottom padding is the home
 * indicator inset and nothing else.
 */
export function TabBar({ onRegister }: { onRegister: () => void }) {
  const half = Math.ceil(TAB_ROUTES.length / 2)
  const left = TAB_ROUTES.slice(0, half)
  const right = TAB_ROUTES.slice(half)

  return (
    <nav
      aria-label={STRINGS.nav.abas}
      className="flex shrink-0 items-start border-t border-line bg-bg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {left.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          aria-label={STRINGS.nav.registrarAgua}
          onClick={onRegister}
          className="-mt-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-b-[3px]
                     border-water-edge bg-water text-ink-on-water active:bg-water-edge transition-colors duration-100"
        >
          <Plus size={26} strokeWidth={2.6} />
        </button>
      </div>
      {right.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
    </nav>
  )
}
