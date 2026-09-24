import { STRINGS } from '@/lib/strings'
import { fishName, unlockLabel, UNLOCKS, type FishId } from './catalog'
import { Fish } from './Fish'

type Props = {
  variants: readonly FishId[]
  unlocked: ReadonlySet<FishId>
  selected: FishId | null
  onSelect: (id: FishId) => void
  disabled?: boolean
}

/**
 * The gallery grid (spec §5.5): unlocked fish in colour and tappable, locked ones as flat
 * silhouettes with their condition. Also the onboarding picker, fed the four starters.
 */
export function FishGrid({ variants, unlocked, selected, onSelect, disabled = false }: Props) {
  return (
    <ul aria-label={STRINGS.peixes.galeria} className="grid grid-cols-2 gap-3">
      {variants.map((id) => {
        const open = unlocked.has(id)
        const locked = !open
        const picked = selected === id
        return (
          <li key={id}>
            <button
              type="button"
              aria-label={fishName(id)}
              aria-pressed={picked}
              aria-disabled={locked ? true : undefined}
              disabled={disabled}
              onClick={() => {
                if (locked) return
                onSelect(id)
              }}
              className={`flex min-h-[44px] w-full flex-col items-center rounded-control bg-surface-2 px-2 py-3 ${
                picked ? 'border-2 border-water' : 'border border-line'
              } ${open ? 'active:bg-line transition-colors duration-100' : ''}`}
            >
              <Fish variant={id} size={140} state={open ? 'still' : 'locked'} />
              <span className={`mt-1 text-[13px] font-bold ${open ? 'text-ink' : 'text-ink-2'}`}>{fishName(id)}</span>
              {open ? null : (
                <span className="mt-0.5 text-center text-[10px] font-extrabold uppercase tracking-[1px] text-ink-2">
                  {unlockLabel(UNLOCKS[id])}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
