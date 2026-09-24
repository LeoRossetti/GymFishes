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
export const FISH_W = 56
export const FISH_H = FISH_W * 0.625
/** Air between the fish's back and the surface, so the wave crest never cuts the fish. */
const GAP = 6

/**
 * The fish's `bottom`, in px, for a given fill %: it swims just under the surface, and rests on
 * the tube floor while the water is still shallower than the fish. Because it sits inside the
 * water, a full tube never clips it — no special case is needed at 100%.
 */
export function fishBottomPx(pct: number): number {
  return Math.max(0, (pct / 100) * TUBE_H - FISH_H - GAP)
}

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
    if (!grew || reduced) return
    setSplash(true)
    const t = window.setTimeout(() => setSplash(false), 450)
    return () => window.clearTimeout(t)
  }, [totalMl, reduced])

  return (
    <div className="min-w-[140px] max-w-[160px] flex-1 shrink-0">
      <div className="relative h-[220px] overflow-hidden rounded-card border-2 border-line bg-surface-2">
        <motion.div className="absolute inset-x-0 bottom-0" animate={{ height: `${pct}%` }} transition={spring}>
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
          <div className="h-full w-full bg-water" />
        </motion.div>
        {totalMl > 0 ? (
          <motion.span
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2"
            animate={{ bottom: `${fishBottomPx(pct)}px` }}
            transition={spring}
          >
            <Fish variant={fishOf(fishVariant)} size={FISH_W} state="idle" />
          </motion.span>
        ) : null}
      </div>
      <p className="mt-2 text-center text-[24px] font-extrabold tracking-[-0.4px]">
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
