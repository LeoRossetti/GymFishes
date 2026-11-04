import { NavLink } from 'react-router'
import { TAB_ROUTES, type TabRoute } from './routes'
import { STRINGS } from '@/lib/strings'
import { Plus } from '@/ui/icons'

/**
 * Space under the tab names (spec M7 §5). A tab runs to the screen's bottom edge, so its target is
 * the bar's full height, while its name ends 26px off the edge on an iPhone (the home-indicator
 * inset less 8px), 13px clear of the indicator; 8px on a phone without one.
 */
const EDGE = 'max(8px, calc(env(safe-area-inset-bottom, 0px) - 8px))'

/** A 26px icon 8px under the border, its name 3px below it: a 50px row, then EDGE. */
function Tab({ route }: { route: TabRoute }) {
  return (
    <NavLink
      to={route.path}
      style={{ paddingBottom: EDGE }}
      className={({ isActive }) =>
        `group flex flex-1 flex-col items-center pt-2 ${isActive ? 'text-water' : 'text-ink-2'}`
      }
    >
      {({ isActive }) => (
        // The press shrinks the icon and name together on the first frame and lets go in 100ms.
        <span className="flex flex-col items-center gap-[3px] transition-transform duration-100 ease-out group-active:scale-[0.92] group-active:duration-0">
          {route.icon({ active: isActive })}
          <span className="text-[11px] leading-[13px] font-bold">{route.label}</span>
        </span>
      )}
    </NavLink>
  )
}

/**
 * Four named tabs around the raised plus (spec M7 §5): 76px on an iPhone, 58px without a home
 * indicator. A normal flex row: the shell frame places it under the scroll region, so it is never
 * `position: fixed`. `relative z-10` lifts the bar over the scroll region: the plus rises 18px
 * into it, and without its own layer the screen scrolling behind covers that part (all of it in
 * WebKit, positioned pieces in Chromium).
 */
export function TabBar({ onRegister }: { onRegister: () => void }) {
  const half = Math.ceil(TAB_ROUTES.length / 2)
  const left = TAB_ROUTES.slice(0, half)
  const right = TAB_ROUTES.slice(half)

  return (
    <nav aria-label={STRINGS.nav.abas} className="relative z-10 flex shrink-0 items-start border-t border-line bg-bg">
      {left.map((route) => (
        <Tab key={route.path} route={route} />
      ))}
      <div className="flex flex-1 justify-center">
        {/* A 52px face over a 3px edge, risen 18px: the face ends level with the icons' feet.
            Pressed, the face sinks onto the edge: it drops 3px and the edge goes, so its bottom stays put. */}
        <button
          type="button"
          aria-label={STRINGS.nav.registrarAgua}
          onClick={onRegister}
          className="-mt-[18px] flex h-[55px] w-[52px] items-center justify-center rounded-full border-b-[3px]
                     border-water-edge bg-water text-ink-on-water active:h-[52px] active:translate-y-[3px] active:border-b-0"
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
