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
 * Every card is the same size whatever it holds: equal rows, the card fills its cell, the same
 * 2px border picked or not, and the fish shrinks with a narrow screen instead of spilling out.
 */
export function FishGrid({ variants, unlocked, selected, onSelect, disabled = false, progress }: Props) {
  const uid = useId()
  return (
    <ul aria-label={STRINGS.peixes.galeria} className="grid auto-rows-fr grid-cols-2 gap-3">
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
              className={`flex h-full min-h-[44px] w-full flex-col items-center rounded-control border-2 bg-surface-2 px-2 py-3 ${
                picked ? 'border-water' : 'border-line'
              } ${open ? 'justify-center active:bg-line transition-colors duration-100' : ''}`}
            >
              <span className="block w-full max-w-[140px] [&>svg]:h-auto [&>svg]:w-full">
                <Fish variant={id} size={140} state={open ? 'still' : 'locked'} />
              </span>
              <span className={`mt-1 text-center text-[13px] font-bold ${open ? 'text-ink' : 'text-ink-2'}`}>{fishName(id)}</span>
              {open ? null : (
                <span id={condId} className="mt-0.5 text-center text-[10px] font-extrabold uppercase tracking-[1px] text-balance text-ink-2">
                  {unlockLabel(UNLOCKS[id])}
                </span>
              )}
              {howFar ? (
                <span className="mt-auto flex w-full flex-col items-center pt-1">
                  <span id={progId} className="text-[11px] font-bold tabular-nums text-ink-2">
                    {progressText(UNLOCKS[id], howFar)}
                  </span>
                  <span aria-hidden className="mt-1 h-1 w-full overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-water" style={{ width: `${(howFar.current / howFar.target) * 100}%` }} />
                  </span>
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
