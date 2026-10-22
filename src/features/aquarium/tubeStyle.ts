export type TubeStyle = 'cenario' | 'agua'

export const TUBE_STYLE_KEY = 'gymfishes:tube'

/** The stored pick, or "Com cenário" when nothing, something unknown, or a blocked storage. */
export function readTubeStyle(): TubeStyle {
  try {
    const v = localStorage.getItem(TUBE_STYLE_KEY)
    return v === 'agua' ? 'agua' : 'cenario'
  } catch {
    return 'cenario'
  }
}

export function storeTubeStyle(s: TubeStyle): void {
  try {
    localStorage.setItem(TUBE_STYLE_KEY, s)
  } catch {
    // storage blocked (private mode, quota): the pick still applies for this session
  }
}
