import { useId } from 'react'
import { STRINGS } from '@/lib/strings'
import { fishName, unlockLabel, UNLOCKS, type FishId } from './catalog'
import { Fish } from './Fish'
import { progressText } from './progress'
import type { Progress } from './unlocks'

type Props = {
  variants: readonly FishId[]
  unlocked: ReadonlySet<FishId>
  selected: FishId | null
  onSelect: (id: FishId) => void
  disabled?: boolean
  /** How far a locked fish is; the onboarding picker passes none. */
  progress?: (id: FishId) => Progress | null
}

/**
 * The gallery grid (spec §5.5): unlocked fish in colour and tappable, locked ones as flat
 * silhouettes with their condition. Also the onboarding picker, fed the four starters.
 * A locked fish's name is its label; the condition and the "N de M" line are its description.
 */
export function FishGrid({ variants, unlocked, selected, onSelect, disabled = false, progress }: Props) {
  const uid = useId()
  return (
    <ul aria-label={STRINGS.peixes.galeria} className="grid grid-cols-2 gap-3">
      {variants.map((id) => {
        const open = unlocked.has(id)
        const locked = !open
        const picked = selected === id
        const howFar = locked ? progress?.(id) : null
        const condId = `${uid}-${id}-cond`
        const progId = `${uid}-${id}-prog`
        return (
          <li key={id}>
            <button
              type="button"
              aria-label={fishName(id)}
              aria-describedby={locked ? (howFar ? `${condId} ${progId}` : condId) : undefined}
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
                <span id={condId} className="mt-0.5 text-center text-[10px] font-extrabold uppercase tracking-[1px] text-ink-2">
                  {unlockLabel(UNLOCKS[id])}
                </span>
              )}
              {howFar ? (
                <>
                  <span id={progId} className="mt-0.5 text-[11px] font-bold tabular-nums text-ink-2">
                    {progressText(UNLOCKS[id], howFar)}
                  </span>
                  <span aria-hidden className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-water" style={{ width: `${(howFar.current / howFar.target) * 100}%` }} />
                  </span>
                </>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
