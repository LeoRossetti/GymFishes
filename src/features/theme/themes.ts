/** Spec M7 §7. Six dark themes; the id is what `localStorage` and `data-theme` carry. */
export const THEME_IDS = ['fundo-do-mar', 'tinta', 'aquario', 'meia-noite', 'areia', 'breu'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const DEFAULT_THEME: ThemeId = 'fundo-do-mar'

export type ThemeTokens = {
  bg: string
  surface: string
  surface2: string
  line: string
  ink: string
  ink2: string
  ink3: string
  water: string
  waterEdge: string
  waterHi: string
  inkOnWater: string
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  'fundo-do-mar': {
    bg: '#0A1421', surface: '#162638', surface2: '#213850', line: '#32496A',
    ink: '#F2F7FB', ink2: '#A3B9CB', ink3: '#6F879B',
    water: '#1CB0F6', waterEdge: '#1791CC', waterHi: '#62CDFF', inkOnWater: '#072536',
  },
  tinta: {
    bg: '#0B0E12', surface: '#1A2028', surface2: '#262E38', line: '#3B4552',
    ink: '#F4F6F8', ink2: '#A0ADBA', ink3: '#6F7D8A',
    water: '#22C4F5', waterEdge: '#1A9CC6', waterHi: '#7ADDFF', inkOnWater: '#06232E',
  },
  aquario: {
    bg: '#04171D', surface: '#0F2C36', surface2: '#17404D', line: '#255A6B',
    ink: '#EEF8FA', ink2: '#94BAC4', ink3: '#628B96',
    water: '#14B5EC', waterEdge: '#0F91BE', waterHi: '#66DBFF', inkOnWater: '#052330',
  },
  'meia-noite': {
    bg: '#0C0E1C', surface: '#1A1D36', surface2: '#262A4C', line: '#3B4070',
    ink: '#F3F3FB', ink2: '#A6A9CC', ink3: '#74789C',
    water: '#2AB3F7', waterEdge: '#1F8FCB', waterHi: '#7FD3FF', inkOnWater: '#071B33',
  },
  areia: {
    bg: '#141210', surface: '#23201C', surface2: '#302B26', line: '#48413A',
    ink: '#F6F1EA', ink2: '#B5AA9C', ink3: '#83796C',
    water: '#1CB0F6', waterEdge: '#1791CC', waterHi: '#62CDFF', inkOnWater: '#072536',
  },
  breu: {
    bg: '#0D0F12', surface: '#181B20', surface2: '#23272D', line: '#373C44',
    ink: '#F3F5F7', ink2: '#A2ABB3', ink3: '#6F7880',
    water: '#1CB0F6', waterEdge: '#1791CC', waterHi: '#62CDFF', inkOnWater: '#072536',
  },
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}
