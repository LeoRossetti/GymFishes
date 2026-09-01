import { useEffect, useReducer, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { useBottles } from '@/features/bottles/queries'
import { useInsertEntry, useUpdateEntry } from '@/features/entries/mutations'
import type { Entry } from '@/features/entries/cache'
import { describeComposition, totalMl } from '@/lib/composition'
import { MAX_ML } from '@/lib/keypad'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { useToast } from '@/ui/Toast'
import { BottleGrid } from './BottleGrid'
import { LooseAmount } from './LooseAmount'
import { OptionalChips } from './OptionalChips'
import { draftFromEntry, draftItems, draftReducer, emptyDraft } from './draft'
import { submitDraft } from './submit'
import { useCountUp } from './useCountUp'

export function RegisterSheet({ entry, onClose }: { entry: Entry | undefined; onClose: () => void }) {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const groupId = bootstrap.data?.groupId ?? ''
  const bottles = useBottles(userId)
  const toast = useToast()
  const onFailure = () => toast(STRINGS.registrar.falhou)
  const insert = useInsertEntry(groupId, onFailure)
  const update = useUpdateEntry(groupId, onFailure)
  const [draft, dispatch] = useReducer(draftReducer, entry, (e) =>
    e ? draftFromEntry(e) : emptyDraft(new Date()),
  )
  const [openChip, setOpenChip] = useState<'nota' | 'hora' | null>(null)
  const submitted = useRef(false)

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
  const shownTotal = useCountUp(total)
  const canSave = total >= 1 && total <= MAX_ML && Boolean(userId) && Boolean(groupId)

  function submit() {
    if (!canSave || !userId || !groupId || submitted.current) return
    submitted.current = true
    submitDraft(
      {
        userId,
        groupId,
        insert: (input) => insert.mutate(input),
        update: (vars, opts) => update.mutate(vars, opts),
        toast,
      },
      draft,
      entry,
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[430px]">
      <button type="button" aria-label={STRINGS.registrar.fechar} onClick={onClose} className="absolute inset-0 bg-bg/70" />
      <motion.div
        role="dialog"
        aria-label={STRINGS.nav.registrarAgua}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 80) onClose()
        }}
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-card
                   border-t border-line bg-surface px-3 pt-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-[99px] bg-line" />
        <p className="text-center text-[38px] font-extrabold tracking-[-0.4px]">
          {formatVolume(shownTotal)}
        </p>
        {items.some((i) => i.kind === 'bottle') ? (
          <p className="text-center text-[13px] text-ink-3">{describeComposition(items)}</p>
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
        <Button className="mt-5" disabled={!canSave} onClick={submit}>
          {entry
            ? STRINGS.registrar.salvarAlteracoes
            : total > 0
              ? STRINGS.registrar.registrar(formatVolume(total))
              : STRINGS.registrar.registrarVazio}
        </Button>
      </motion.div>
    </div>
  )
}
