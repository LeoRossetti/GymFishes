import { useCallback, useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, storeTheme } from './theme'
import type { ThemeId } from './themes'

/** The current theme and a setter that persists per device and applies at once (spec M7 §7.1). */
export function useTheme(): { theme: ThemeId; setTheme: (id: ThemeId) => void } {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  const setTheme = useCallback((id: ThemeId) => {
    storeTheme(id)
    setThemeState(id)
  }, [])
  return { theme, setTheme }
}
