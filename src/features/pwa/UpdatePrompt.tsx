import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { AppUpdate } from '@/features/pwa/registerSW'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

/** "Nova versão disponível — atualizar" (spec §9). Informs and offers; never reloads on its own. */
export function UpdatePrompt({ ready, apply }: AppUpdate) {
  const reduced = useReducedMotion()
  const [busy, setBusy] = useState(false)
  if (!ready) return null
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.2 }}
      className="fixed inset-x-3 bottom-28 z-40 mx-auto flex max-w-[406px] items-center gap-3
                 rounded-control border border-line bg-surface-2 p-2 pl-4"
    >
      <p className="min-w-0 flex-1 text-[13px] font-bold text-ink">{STRINGS.atualizacao.disponivel}</p>
      <div className="w-[128px] shrink-0">
        <Button
          disabled={busy}
          aria-busy={busy || undefined}
          onClick={() => {
            setBusy(true)
            apply().catch(() => setBusy(false))
          }}
        >
          {busy ? STRINGS.atualizacao.atualizando : STRINGS.atualizacao.atualizar}
        </Button>
      </div>
    </motion.div>
  )
}
