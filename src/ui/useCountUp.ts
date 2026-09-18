import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

/**
 * Animates `value` changes over 500 ms ease-out (spec §8 "Number count-up"). `from` is where the
 * first render starts — the tube leaves it at `value` (no jump on mount), the record screen
 * passes 0 so the number climbs. Reduced motion, or no matchMedia (tests), snaps.
 */
export function useCountUp(value: number, from: number = value): number {
  const [shown, setShown] = useState(from)
  const prev = useRef(from)
  useEffect(() => {
    const reduced =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = prev.current
    prev.current = value
    if (reduced || start === value) {
      setShown(value)
      return
    }
    const controls = animate(start, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])
  return shown
}
