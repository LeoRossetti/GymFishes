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
    <ul aria-label={STRINGS.peixes.galeria} className="grid grid-cols-4 gap-2">
      {variants.map((id) => {
        const open = unlocked.has(id)
        const picked = selected === id
        return (
          <li key={id}>
            <button
              type="button"
              aria-label={fishName(id)}
              aria-pressed={picked}
              disabled={disabled || !open}
              onClick={() => onSelect(id)}
              className={`flex min-h-[44px] w-full flex-col items-center rounded-control bg-surface-2 px-1 py-2 ${
                picked ? 'border-2 border-water' : 'border border-line'
              }`}
            >
              <Fish variant={id} size={56} state={open ? 'still' : 'locked'} />
              <span className={`mt-1 text-[11px] font-bold ${open ? 'text-ink' : 'text-ink-3'}`}>{fishName(id)}</span>
              {open ? null : (
                <span className="mt-0.5 text-center text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
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
