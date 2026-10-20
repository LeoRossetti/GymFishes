import { useEffect, useReducer, useRef, useState } from 'react'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import { useBottles } from '@/features/bottles/queries'
import { useCelebrations } from '@/features/celebrations/CelebrationProvider'
import { upsertEntry, type Entry } from '@/features/entries/cache'
import { useEntryOps } from '@/features/entries/mutations'
import { useGroupData } from '@/features/group/useGroupData'
import { describeComposition, totalMl } from '@/lib/composition'
import { MAX_ML } from '@/lib/keypad'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { BottleGrid } from './BottleGrid'
import { LooseAmount } from './LooseAmount'
import { OptionalChips } from './OptionalChips'
import { draftFromEntry, draftItems, draftReducer, emptyDraft } from './draft'
import { shouldCloseSheet } from './sheetGesture'
import { submitDraft } from './submit'

export function RegisterSheet({ entry, onClose }: { entry: Entry | undefined; onClose: () => void }) {
  const { userId, groupId: currentGroupId, entries } = useGroupData()
  const groupId = currentGroupId ?? ''
  const bottles = useBottles(userId)
  const ops = useEntryOps(groupId, userId ?? '')
  const { celebrate } = useCelebrations()
  const [draft, dispatch] = useReducer(draftReducer, entry, (e) =>
    e ? draftFromEntry(e) : emptyDraft(new Date()),
  )
  const [openChip, setOpenChip] = useState<'nota' | 'hora' | null>(null)
  const submitted = useRef(false)
  const dragControls = useDragControls()
  const reduced = useReducedMotion() ?? false

  // keep a ref to the current preview URL so unmount always revokes whatever object URL
  // is live at the time — the sheet can close (drag-to-dismiss, backdrop tap) with an
  // unsaved picked photo still on the draft.
  const previewUrlRef = useRef<string | null>(draft.photo?.previewUrl ?? null)
  useEffect(() => {
    previewUrlRef.current = draft.photo?.previewUrl ?? null
  })
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const items = draftItems(draft)
  const total = totalMl(items)
  const canSave = total >= 1 && total <= MAX_ML && Boolean(userId) && Boolean(groupId)

  function submit() {
    if (!canSave || !userId || !groupId || submitted.current) return
    submitted.current = true
    const inserted = submitDraft(ops, userId, draft, entry)
    if (inserted) celebrate(entries, upsertEntry(entries, inserted))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[430px]">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        aria-label={STRINGS.registrar.fechar}
        onClick={onClose}
        className="absolute inset-0 bg-bg/70"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={STRINGS.nav.registrarAgua}
        initial={reduced ? { opacity: 0 } : { y: '100%' }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduced ? { opacity: 0 } : { y: '100%' }}
        transition={reduced ? { duration: 0.12 } : { type: 'spring', duration: 0.28, bounce: 0.15 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_e, info) => {
          if (shouldCloseSheet(info.offset.y, info.velocity.y)) onClose()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] scroll-pb-[120px] overflow-y-auto overscroll-contain rounded-t-card
                   border-t border-line bg-surface px-3 pt-4"
      >
        <button
          type="button"
          aria-label={STRINGS.registrar.fechar}
          autoFocus
          onClick={onClose}
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: 'none' }}
          className="mx-auto -mt-1 mb-2 flex min-h-[44px] w-11 items-center justify-center"
        >
          <div className="h-1 w-10 rounded-[99px] bg-line" />
        </button>
        <p className="text-center text-[38px] font-extrabold tabular-nums tracking-[-0.4px]">
          {formatVolume(total)}
        </p>
        {items.some((i) => i.kind === 'bottle') ? (
          <p className="text-center text-[13px] text-ink-2">{describeComposition(items)}</p>
        ) : null}
        <BottleGrid userId={userId} bottles={bottles.data ?? []} draft={draft} dispatch={dispatch} />
        <LooseAmount draft={draft} dispatch={dispatch} />
        <OptionalChips
          draft={draft}
          dispatch={dispatch}
          open={openChip}
          setOpen={setOpenChip}
          entryHasPhoto={Boolean(entry?.photo_path)}
        />
        <div
          className="sticky bottom-0 -mx-3 mt-5 bg-surface px-3 pt-2"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <Button disabled={!canSave} onClick={submit}>
            {entry ? (
              STRINGS.registrar.salvarAlteracoes
            ) : total > 0 ? (
              <>
                {STRINGS.registrar.registrarVazio} <span className="normal-case">{formatVolume(total)}</span>
              </>
            ) : (
              STRINGS.registrar.registrarVazio
            )}
          </Button>
          {total > MAX_ML ? (
            <p className="mt-2 text-[13px] text-ink-2">{STRINGS.registrar.maximo(formatVolume(MAX_ML))}</p>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
