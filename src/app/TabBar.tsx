import { NavLink } from 'react-router'
import { TAB_ROUTES, type TabRoute } from './routes'
import { STRINGS } from '@/lib/strings'
import { Plus } from '@/ui/icons'

/**
 * Each tab runs to the screen's bottom edge, so its target is the bar's full height (51px on an
 * iPhone, 44px with no home indicator) while its icon stays above the indicator's swipe zone:
 * the home-indicator inset less 12px leaves the icon 22px off the edge, 9px over the indicator.
 */
const TAB_BOTTOM = 'max(15px, calc(env(safe-area-inset-bottom, 0px) - 12px))'

function Tab({ route }: { route: TabRoute }) {
  return (
    <NavLink
      to={route.path}
      style={{ paddingBottom: TAB_BOTTOM }}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center pt-[5px] active:bg-line transition-colors duration-100
         ${isActive ? 'text-water' : 'text-ink-2'}`
      }
    >
      {({ isActive }) => (
        <>
          {route.icon({ active: isActive })}
          <span className="sr-only">{route.label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * Four icon tabs around the raised plus (spec M7 §5). The screen's name is the header's
 * centred title, so the tab names live on for screen readers only and the bar is 52px on an
 * iPhone 14 instead of 73px. A normal flex row: the shell frame places it under the scroll
 * region, so it is never `position: fixed`. `relative z-10` lifts the bar over the scroll
 * region: the plus rises 21px into it, and without its own layer the screen scrolling behind
 * covers that part (all of it in WebKit, positioned pieces in Chromium).
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
        {/* A 48px face over a 3px edge, its bottom level with the tabs' 22px clearance. Pressed,
            the face sinks onto the edge: it drops 3px and the edge goes, so its bottom stays put. */}
        <button
          type="button"
          aria-label={STRINGS.nav.registrarAgua}
          onClick={onRegister}
          className="-mt-[22px] flex h-[51px] w-12 items-center justify-center rounded-full border-b-[3px]
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
