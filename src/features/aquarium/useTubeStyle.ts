import { useCallback, useState } from 'react'
import { readTubeStyle, storeTubeStyle, type TubeStyle } from './tubeStyle'

/** The tube style and a setter that persists per device (spec M10 §3.7). */
export function useTubeStyle(): { style: TubeStyle; setStyle: (s: TubeStyle) => void } {
  const [style, setStyleState] = useState<TubeStyle>(readTubeStyle)
  const setStyle = useCallback((s: TubeStyle) => {
    storeTubeStyle(s)
    setStyleState(s)
  }, [])
  return { style, setStyle }
}
