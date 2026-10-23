import { NavLink } from 'react-router'
import { TAB_ROUTES, type TabRoute } from './routes'
import { STRINGS } from '@/lib/strings'
import { Plus } from '@/ui/icons'

function Tab({ route }: { route: TabRoute }) {
  return (
    <NavLink
      to={route.path}
      className={({ isActive }) =>
        `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-[14px] font-bold
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
 * Four tabs around the raised plus (spec M7 §5). A normal flex row: the shell frame places it
 * under the scroll region, so it is never `position: fixed`. The bottom padding is the home
 * indicator inset, taken once and 10px short: the labels stay 15px clear of the indicator
 * without the empty band a full 34px left under them. `relative z-10` lifts the bar over the
 * scroll region: the plus rises 10px into it, and without its own layer the screen scrolling
 * behind covers that part (all of it in WebKit, positioned pieces in Chromium).
 */
export function TabBar({ onRegister }: { onRegister: () => void }) {
  const half = Math.ceil(TAB_ROUTES.length / 2)
  const left = TAB_ROUTES.slice(0, half)
  const right = TAB_ROUTES.slice(half)

  return (
    <nav
      aria-label={STRINGS.nav.abas}
      className="relative z-10 flex shrink-0 items-start border-t border-line bg-bg"
      style={{ paddingBottom: 'max(0px, calc(env(safe-area-inset-bottom, 0px) - 10px))' }}
    >
      {left.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
      <div className="flex flex-1 justify-center">
        {/* A 48px face over a 3px edge. Pressed, the face sinks onto the edge: it drops 3px and the
            edge goes, so its bottom stays where the edge was. */}
        <button
          type="button"
          aria-label={STRINGS.nav.registrarAgua}
          onClick={onRegister}
          className="-mt-[11px] flex h-[51px] w-12 items-center justify-center rounded-full border-b-[3px]
                     border-water-edge bg-water text-ink-on-water active:h-12 active:translate-y-[3px] active:border-b-0"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      </div>
      {right.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
    </nav>
  )
}
