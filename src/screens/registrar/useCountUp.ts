import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

export function useCountUp(value: number): number {
  const [shown, setShown] = useState(value)
  const prev = useRef(value)
  useEffect(() => {
    const reduced =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = prev.current
    prev.current = value
    if (reduced || from === value) {
      setShown(value)
      return
    }
    const controls = animate(from, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])
  return shown
}
