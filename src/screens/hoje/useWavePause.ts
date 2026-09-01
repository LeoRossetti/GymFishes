import { useEffect, useState, type RefObject } from 'react'

export function useWavePause(ref: RefObject<HTMLElement | null>): boolean {
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  const [offscreen, setOffscreen] = useState(false)

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOffscreen(e ? !e.isIntersecting : false))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])

  return hidden || offscreen
}
