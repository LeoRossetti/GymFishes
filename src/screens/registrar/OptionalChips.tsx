import { useRef } from 'react'
import { formatTime } from '@/lib/format'
import { fromDatetimeLocal, toDatetimeLocal } from '@/lib/dates'
import { processPhoto } from '@/lib/image'
import { STRINGS } from '@/lib/strings'
import { useToast } from '@/ui/Toast'
import type { Draft, DraftAction } from './draft'

type Props = {
  draft: Draft
  dispatch: (a: DraftAction) => void
  open: 'nota' | 'hora' | null
  setOpen: (v: 'nota' | 'hora' | null) => void
  entryHasPhoto: boolean
}

const CHIP = 'min-h-[44px] rounded-[99px] border px-4 text-[13px] font-bold'
const CHIP_OFF = `${CHIP} border-dashed border-line text-ink-3`
const CHIP_ON = `${CHIP} border-ok text-ok`

/** 44px hit area around a visually compact badge — mirrors BottleGrid's decrement badge. */
function RemoveBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={STRINGS.registrar.removerFoto}
      onClick={onClick}
      className="absolute -top-3 -right-3 flex h-11 w-11 items-center justify-center"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-[99px] border
                   border-water bg-water text-[11px] font-extrabold text-ink-on-water"
      >
        ✕
      </span>
    </button>
  )
}

export function OptionalChips({ draft, dispatch, open, setOpen, entryHasPhoto }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      const { photo, thumb } = await processPhoto(file)
      if (draft.photo) URL.revokeObjectURL(draft.photo.previewUrl) // replacing a prior pick
      dispatch({
        type: 'setPhoto',
        photo: { blob: photo, thumb, previewUrl: URL.createObjectURL(photo) },
      })
    } catch {
      toast(STRINGS.registrar.fotoErro) // spec §14: the register proceeds without the photo
    }
  }

  return (
    <section className="mt-4">
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {draft.photo ? (
          <span className={`${CHIP_ON} relative flex items-center gap-2`}>
            <img
              src={draft.photo.previewUrl}
              alt=""
              className="h-6 w-6 rounded-[4px] object-cover"
            />
            <RemoveBadge
              onClick={() => {
                URL.revokeObjectURL(draft.photo!.previewUrl)
                dispatch({ type: 'clearPhoto' })
              }}
            />
          </span>
        ) : entryHasPhoto && !draft.photoRemoved ? (
          <span className="relative">
            <button type="button" className={CHIP_ON} onClick={() => fileRef.current?.click()}>
              {STRINGS.registrar.foto}
            </button>
            <RemoveBadge onClick={() => dispatch({ type: 'clearPhoto' })} />
          </span>
        ) : (
          <button type="button" className={CHIP_OFF} onClick={() => fileRef.current?.click()}>
            {STRINGS.registrar.foto}
          </button>
        )}
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
