import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fishOf } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { useCountUp } from '@/ui/useCountUp'
import { WaveSurface } from './WaveSurface'

type Props = {
  name: string
  isSelf: boolean
  accent: string
  fishVariant: string
  totalMl: number
  scaleMl: number
}

/** Tube height in px (matches `h-[220px]` below). */
export const TUBE_H = 220
/** Fish width in px — about a third of the tube (spec M7 §8.2). Height follows the 1.6:1 art box. */
const FISH_W = 56
export const FISH_H = FISH_W * 0.625

export function MemberTube({ name, isSelf, accent, fishVariant, totalMl, scaleMl }: Props) {
  const pct = Math.min(100, (totalMl / scaleMl) * 100)
  const reduced = useReducedMotion()
  const spring = reduced
    ? { duration: 0.12 }
    : ({ type: 'spring', duration: 0.6, bounce: 0.25 } as const)
  const [splash, setSplash] = useState(false)
  const prev = useRef(totalMl)
  const shownTotal = useCountUp(totalMl)

  useEffect(() => {
    const grew = totalMl > prev.current
    prev.current = totalMl
    if (!grew || reduced) {
      setSplash(false)
      return
    }
    setSplash(true)
    const t = window.setTimeout(() => setSplash(false), 450)
    return () => window.clearTimeout(t)
  }, [totalMl, reduced])

  return (
    <div className="min-w-[140px] max-w-[160px] flex-1 shrink-0">
      <div className="relative h-[220px] overflow-hidden rounded-card border-2 border-line bg-surface-2">
        <motion.div className="absolute inset-x-0 bottom-0" animate={{ height: `${pct}%` }} transition={spring}>
          {totalMl > 0 ? (
            <span
              className="absolute inset-x-0 top-0 block"
              style={{
                transform: splash ? 'scaleY(2)' : 'scaleY(1)',
                transformOrigin: 'bottom',
                transition: 'transform 450ms ease-out',
              }}
            >
              <WaveSurface />
            </span>
          ) : null}
          {(pct / 100) * TUBE_H >= FISH_H ? (
            <span aria-hidden className="absolute left-1/2 top-[6px] -translate-x-1/2">
              <Fish variant={fishOf(fishVariant)} size={FISH_W} state="idle" />
            </span>
          ) : null}
          <div className="h-full w-full bg-water" />
        </motion.div>
      </div>
      <p className="mt-2 text-center text-[24px] font-extrabold tabular-nums tracking-[-0.4px]">
        {formatVolume(shownTotal)}
      </p>
      <p
        className={`text-center text-[10px] font-extrabold uppercase tracking-[1px] ${ACCENT_TEXT[accentOf(accent)]}`}
      >
        {isSelf ? STRINGS.hoje.voce : name}
      </p>
    </div>
  )
}
