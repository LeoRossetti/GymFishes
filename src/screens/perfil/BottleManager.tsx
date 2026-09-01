import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBottles } from '@/features/bottles/queries'
import { archiveBottle, createBottle, updateBottle } from '@/features/bottles/mutations'
import { BottleForm } from '@/features/bottles/BottleForm'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

export function BottleManager({ userId }: { userId: string | undefined }) {
  const bottles = useBottles(userId)
  const client = useQueryClient()
  const [editing, setEditing] = useState<string | 'nova' | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(op: () => Promise<unknown>) {
    setBusy(true)
    try {
      await op()
      await client.invalidateQueries({ queryKey: ['bottles'] })
      setEditing(null)
      setConfirmando(null)
    } finally {
      setBusy(false)
    }
  }

  const list = bottles.data ?? []

  return (
    <section className="mb-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.garrafas.titulo}
      </h2>

      {list.length === 0 ? (
        <p className="py-2 text-[15px] text-ink-2">{STRINGS.garrafas.vazio}</p>
      ) : (
        <ul>
          {list.map((bottle) => (
            <li key={bottle.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-2 py-2 text-left text-[15px] text-ink"
                onClick={() => setEditing(editing === bottle.id ? null : bottle.id)}
              >
                {bottle.emoji ? <span>{bottle.emoji}</span> : null}
                <span className="flex-1">{bottle.name}</span>
                <span className="text-ink-2">{formatVolume(bottle.volume_ml)}</span>
              </button>

              {editing === bottle.id ? (
                <div className="pb-3">
                  <BottleForm
                    initial={{ name: bottle.name, volume_ml: bottle.volume_ml, emoji: bottle.emoji }}
                    busy={busy}
                    onSave={(input) => void run(() => updateBottle(bottle.id, input))}
                  />
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => {
                      if (confirmando !== bottle.id) return setConfirmando(bottle.id)
                      void run(() => archiveBottle(bottle.id))
                    }}
                  >
                    {confirmando === bottle.id
                      ? STRINGS.garrafas.arquivarMesmo
                      : STRINGS.garrafas.arquivar}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editing === 'nova' ? (
        <div className="pt-3">
          <BottleForm
            busy={busy}
            onSave={(input) => void run(() => createBottle(userId!, input))}
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => setEditing('nova')}
        >
          {STRINGS.garrafas.adicionar}
        </Button>
      )}
    </section>
  )
}
