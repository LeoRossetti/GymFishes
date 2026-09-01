import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createBottle } from '@/features/bottles/mutations'
import { BottleForm } from '@/features/bottles/BottleForm'
import type { Bottle } from '@/features/bottles/queries'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { qtyOf, type Draft, type DraftAction } from './draft'

type Props = {
  userId: string | undefined
  bottles: Bottle[]
  draft: Draft
  dispatch: (a: DraftAction) => void
}

export function BottleGrid({ userId, bottles, draft, dispatch }: Props) {
  const client = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <section className="mt-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.registrar.minhasGarrafas}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {bottles.map((b) => {
          const qty = qtyOf(draft, b.name, b.volume_ml)
          return (
            <div key={b.id} className="relative">
              <button
                type="button"
                onClick={() => dispatch({ type: 'tapBottle', name: b.name, volume_ml: b.volume_ml })}
                className={`min-h-[44px] w-full rounded-control border p-2 text-left text-[13px]
                            font-bold ${qty > 0 ? 'border-water text-water' : 'border-line text-ink-2'} bg-surface-2`}
              >
                {b.emoji ? `${b.emoji} ` : ''}
                {b.name}
                <span className="block text-[11px] font-medium text-ink-3">
                  {formatVolume(b.volume_ml)}
                </span>
              </button>
              {qty > 0 ? (
                <button
                  type="button"
                  aria-label={`${b.name} menos um`}
                  onClick={() => dispatch({ type: 'decBottle', name: b.name, volume_ml: b.volume_ml })}
                  className="absolute -top-2 -right-2 min-h-[24px] rounded-[99px] border border-water
                             bg-water px-2 text-[11px] font-extrabold text-ink-on-water"
                >
                  ×{qty}
                </button>
              ) : null}
            </div>
          )
        })}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="min-h-[44px] rounded-control border border-dashed border-line p-2
                     text-[13px] font-bold text-ink-3"
        >
          {STRINGS.garrafas.novaGarrafa}
        </button>
      </div>
      {adding && userId ? (
        <div className="mt-3">
          <BottleForm
            busy={busy}
            onSave={(input) => {
              setBusy(true)
              createBottle(userId, input)
                .then((created) => {
                  dispatch({ type: 'tapBottle', name: created.name, volume_ml: created.volume_ml })
                  setAdding(false)
                  return client.invalidateQueries({ queryKey: ['bottles'] })
                })
                .finally(() => setBusy(false))
            }}
          />
        </div>
      ) : null}
    </section>
  )
}
