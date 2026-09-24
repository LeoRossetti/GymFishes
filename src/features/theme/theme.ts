import { DEFAULT_THEME, THEMES, isThemeId, type ThemeId } from './themes'

export const THEME_STORAGE_KEY = 'gymfishes:theme'

/** The stored pick, or the default when nothing, something unknown, or a blocked storage. */
export function readStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(v) ? v : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function storeTheme(id: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch {
    // storage blocked (private mode, quota): the theme still applies for this session
  }
}

/** Sets `data-theme` on <html> (tokens.css keys on it) and the status-bar colour to the theme's bg. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[id].bg)
}
