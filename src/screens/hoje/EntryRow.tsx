import { useState } from 'react'
import type { Entry } from '@/features/entries/cache'
import { useSignedUrl } from '@/features/entries/photos'
import { compositionChips, describeComposition, parseComposition } from '@/lib/composition'
import { formatTime, formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

type Props = {
  entry: Entry
  authorName: string
  isOwn: boolean
  onEdit: () => void
  onDelete: () => void
}

export function EntryRow({ entry, authorName, isOwn, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const items = parseComposition(entry.composition)
  const subtitle = entry.note ?? describeComposition(items)
  const thumbUrl = useSignedUrl(entry.thumb_path)
  const photoUrl = useSignedUrl(expanded ? entry.photo_path : null)

  function toggle() {
    setExpanded((v) => !v)
    setConfirmando(false)
  }

  return (
    <li className="border-b border-line py-2 last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className="flex min-h-[44px] w-full items-center gap-3 text-left"
      >
        {thumbUrl.data ? (
          <img
            src={thumbUrl.data}
            alt=""
            className="h-[42px] w-[42px] shrink-0 rounded-control object-cover"
          />
        ) : (
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-control bg-surface-2 text-[17px]">
            💧
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">
            {authorName} · {formatTime(new Date(entry.drank_at))}
          </span>
          {subtitle ? (
            <span className="block truncate text-[11px] text-ink-3">{subtitle}</span>
          ) : null}
        </span>
        <span className="text-[15px] font-extrabold text-water">
          {formatVolume(entry.total_ml)}
        </span>
      </button>
      {expanded ? (
        <div className="mt-2 pl-[54px]">
          {photoUrl.data ? (
            <img
              src={photoUrl.data}
              alt={STRINGS.registros.fotoDoRegistro}
              className="mb-2 w-full rounded-control"
            />
          ) : null}
          {entry.note ? <p className="mb-2 text-[13px] text-ink-2">{entry.note}</p> : null}
          <div className="mb-2 flex flex-wrap gap-2">
            {compositionChips(items).map((chip) => (
              <span
                key={chip}
                className="rounded-[99px] border border-line bg-surface-2 px-3 py-1 text-[11px] font-bold text-ink-2"
              >
                {chip}
              </span>
            ))}
          </div>
          {isOwn ? (
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={onEdit}>
                {STRINGS.registros.editar}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => (confirmando ? onDelete() : setConfirmando(true))}
              >
                {confirmando ? STRINGS.registros.excluirMesmo : STRINGS.registros.excluir}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
