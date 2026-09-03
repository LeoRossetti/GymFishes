import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { WaveSurface } from './WaveSurface'

type Props = { name: string; isSelf: boolean; accent: string; totalMl: number; scaleMl: number }

const FISH_KNEE = 70

/**
 * Where the fish floats for a given fill %. It rides the surface until the
 * water nears the top, then decelerates tangentially (no kink) and stops at
 * 85% — submerged under the wave instead of clipped above the tube, which the
 * leader would otherwise hit at exactly 100% once past the 3 L scale floor.
 */
export function fishLevel(pct: number): number {
  if (pct <= FISH_KNEE) return pct
  const x = pct - FISH_KNEE
  return FISH_KNEE + x - x ** 2 / (2 * (100 - FISH_KNEE))
}

export function MemberTube({ name, isSelf, accent, totalMl, scaleMl }: Props) {
  const pct = Math.min(100, (totalMl / scaleMl) * 100)
  const reduced = useReducedMotion()
  const spring = reduced
    ? { duration: 0.12 }
    : ({ type: 'spring', duration: 0.6, bounce: 0.25 } as const)
  const [splash, setSplash] = useState(false)
  const prev = useRef(totalMl)

  useEffect(() => {
    const grew = totalMl > prev.current
    prev.current = totalMl
    if (!grew || reduced) return
    setSplash(true)
    const t = window.setTimeout(() => setSplash(false), 450)
    return () => window.clearTimeout(t)
  }, [totalMl, reduced])

  return (
    <div className="w-[160px] shrink-0">
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
            className="absolute left-1/2 -translate-x-1/2 text-[20px]"
            animate={{ bottom: `${fishLevel(pct)}%` }}
            transition={spring}
          >
            🐟
          </motion.span>
        ) : null}
      </div>
      <p className="mt-2 text-center text-[17px] font-extrabold tracking-[-0.4px]">
        {formatVolume(totalMl)}
      </p>
      <p
        className={`text-center text-[9px] font-extrabold uppercase tracking-[1px] ${ACCENT_TEXT[accentOf(accent)]}`}
      >
        {isSelf ? STRINGS.hoje.voce : name}
      </p>
    </div>
  )
}
