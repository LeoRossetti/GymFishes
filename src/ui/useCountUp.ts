import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

/**
 * Animates `value` changes over 500 ms ease-out (spec §8 "Number count-up"). A retarget mid-count
 * continues from the number on screen. `from` is where the first render starts — the tube leaves
 * it at `value` (no jump on mount), the record screen passes 0 so the number climbs. Reduced
 * motion, or no matchMedia (tests), snaps.
 */
export function useCountUp(value: number, from: number = value): number {
  const [shown, setShown] = useState(from)
  const shownRef = useRef(from)
  useEffect(() => {
    const reduced =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = shownRef.current
    if (reduced || start === value) {
      shownRef.current = value
      setShown(value)
      return
    }
    const controls = animate(start, value, {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        shownRef.current = Math.round(v)
        setShown(shownRef.current)
      },
    })
    return () => controls.stop()
  }, [value])
  return shown
}
