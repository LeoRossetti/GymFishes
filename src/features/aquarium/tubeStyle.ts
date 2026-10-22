export type TubeStyle = 'cenario' | 'agua'

export const TUBE_STYLE_KEY = 'gymfishes:tube'

/** A pick that blocked storage refused: it holds until the page reloads, so leaving Perfil keeps it. */
let unsaved: TubeStyle | null = null

/** The pick, or "Com cenário" when nothing, something unknown, or a blocked storage. */
export function readTubeStyle(): TubeStyle {
  if (unsaved) return unsaved
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
    unsaved = null
  } catch {
    // storage blocked (private mode, quota): the pick still applies for this session
    unsaved = s
  }
}
