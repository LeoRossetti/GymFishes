import { formatTime } from '@/lib/format'
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import type { Draft, DraftAction } from './draft'

type Props = {
  draft: Draft
  dispatch: (a: DraftAction) => void
  open: 'nota' | 'hora' | null
  setOpen: (v: 'nota' | 'hora' | null) => void
}

const CHIP = 'min-h-[44px] rounded-[99px] border px-4 text-[13px] font-bold'
const CHIP_OFF = `${CHIP} border-dashed border-line text-ink-3`
const CHIP_ON = `${CHIP} border-ok text-ok`

export function OptionalChips({ draft, dispatch, open, setOpen }: Props) {
  return (
    <section className="mt-4">
      <div className="flex gap-2">
        <button
          type="button"
          className={draft.note ? CHIP_ON : CHIP_OFF}
          onClick={() => setOpen(open === 'nota' ? null : 'nota')}
        >
          {STRINGS.registrar.nota}
        </button>
        <button
          type="button"
          className={draft.drankAtEdited ? CHIP_ON : CHIP_OFF}
          onClick={() => setOpen(open === 'hora' ? null : 'hora')}
        >
          {draft.drankAtEdited ? `🕐 ${formatTime(draft.drankAt)}` : STRINGS.registrar.agora}
        </button>
      </div>
      {open === 'nota' ? (
        <textarea
          value={draft.note}
          maxLength={140}
          rows={2}
          onChange={(e) => dispatch({ type: 'setNote', note: e.target.value })}
          className="mt-2 w-full rounded-control border border-line bg-surface-2 p-3
                     text-[15px] text-ink outline-none focus:border-water"
        />
      ) : null}
      {open === 'hora' ? (
        <input
          type="datetime-local"
          value={toDatetimeLocal(draft.drankAt)}
          onChange={(e) => e.target.value && dispatch({ type: 'setDrankAt', at: fromDatetimeLocal(e.target.value) })}
          className="mt-2 min-h-[44px] w-full rounded-control border border-line bg-surface-2 px-3
                     text-[15px] text-ink outline-none focus:border-water"
        />
      ) : null}
    </section>
  )
}
