import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fishName, type FishId } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { useCountUp } from '@/ui/useCountUp'
import { Bubbles } from './Bubbles'
import { celebrationText, type FullScreenCelebration } from './engine'

export const AUTO_DISMISS_MS = 4000

type Props = {
  celebration: FullScreenCelebration
  onClose: () => void
  onChoose: (fish: FishId) => void
}

/**
 * The one full screen a register may earn (spec §7). Tap anywhere to dismiss; record and streak
 * also leave on their own after 4 s, while the unlock waits for "Escolher agora" / "Depois".
 * Flat shapes only: bubbles rise, the content springs up, the number counts. Reduced motion
 * collapses everything to a 120 ms crossfade.
 */
export function CelebrationScreen({ celebration, onClose, onChoose }: Props) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (celebration.kind === 'unlock') return
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [celebration, onClose])

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const fade = { duration: reduced ? 0.12 : 0.25 }
  const spring = reduced ? { duration: 0.12 } : ({ type: 'spring', duration: 0.9, bounce: 0.35 } as const)

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={celebrationText(celebration)}
      tabIndex={-1}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade}
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col items-center justify-center overflow-hidden bg-bg/95 px-6 text-center"
    >
      <p role="status" className="sr-only">
        {celebrationText(celebration)}
      </p>
      {reduced ? null : <Bubbles />}
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 60 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <Body celebration={celebration} />
      </motion.div>
      {celebration.kind === 'unlock' ? (
        <div className="mt-8 w-full">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onChoose(celebration.fish)
            }}
          >
            {STRINGS.celebracoes.escolherAgora}
          </Button>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            {STRINGS.celebracoes.depois}
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}

function Body({ celebration }: { celebration: FullScreenCelebration }) {
  switch (celebration.kind) {
    case 'unlock':
      return (
        <>
          <div className="flex justify-center">
            <Fish variant={celebration.fish} size={200} state="idle" />
          </div>
          <p className="mt-6 text-[24px] font-extrabold tracking-tight">{STRINGS.celebracoes.novoPeixe}</p>
          <p className="mt-1 text-[17px] font-bold text-ink-2">{fishName(celebration.fish)}</p>
        </>
      )
    case 'record':
      return <Record ml={celebration.ml} />
    case 'streak':
      return (
        <p className="text-[38px] font-extrabold tracking-[-0.4px] text-streak">
          {STRINGS.celebracoes.diasSeguidos(celebration.days)}
        </p>
      )
  }
}

function Record({ ml }: { ml: number }) {
  const shown = useCountUp(ml, 0)
  return (
    <p className="text-[38px] font-extrabold tracking-[-0.4px] text-water">
      {STRINGS.celebracoes.novoRecorde(formatVolume(shown))}
    </p>
  )
}
