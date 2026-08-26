import { NavLink } from 'react-router'
import { TAB_ROUTES } from './routes'

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 mx-auto flex max-w-[430px] items-center
                 border-t border-line bg-bg pt-2"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      {TAB_ROUTES.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `flex-1 text-center text-[9px] font-bold ${isActive ? 'text-water' : 'text-ink-3'}`
          }
        >
          <span className="mb-0.5 block text-[15px]">{route.icon}</span>
          {route.label}
        </NavLink>
      ))}
      <div className="flex-1 text-center">
        <button
          type="button"
          aria-label="Registrar água"
          className="mx-auto -mt-3.5 block h-10 w-10 rounded-full border-b-[3px]
                     border-water-edge bg-water text-[19px] font-extrabold text-[#0A2A3A]"
        >
          +
        </button>
      </div>
    </nav>
  )
}
