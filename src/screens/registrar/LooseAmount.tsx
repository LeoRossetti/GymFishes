import { formatVolume } from '@/lib/format'
import type { KeypadKey } from '@/lib/keypad'
import { STRINGS } from '@/lib/strings'
import type { Draft, DraftAction } from './draft'

const PILLS = [100, 200, 250, 500]
const KEYS: KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back']

export function LooseAmount({ draft, dispatch }: { draft: Draft; dispatch: (a: DraftAction) => void }) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.registrar.valorAvulso}
      </h2>
      <div className="mb-2 flex gap-2">
        {PILLS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => dispatch({ type: 'pill', amount })}
            className="min-h-[44px] flex-1 rounded-[99px] border border-line bg-surface-2
                       text-[13px] font-bold text-ink-2"
          >
            +{amount}
          </button>
        ))}
      </div>
      {draft.loose > 0 ? (
        <p className="mb-2 text-center text-[15px] font-bold text-water">{formatVolume(draft.loose)}</p>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={key === 'back' ? '⌫' : key}
            onClick={() => dispatch({ type: 'key', key })}
            className="min-h-[44px] rounded-key border border-line bg-surface-2
                       text-[17px] font-bold"
          >
            {key === 'back' ? '⌫' : key}
          </button>
        ))}
      </div>
    </section>
  )
}
