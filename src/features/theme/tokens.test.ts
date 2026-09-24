import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, THEMES, THEME_IDS, type ThemeTokens } from './themes'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8')

const CSS_NAME: Record<keyof ThemeTokens, string> = {
  bg: '--color-bg',
  surface: '--color-surface',
  surface2: '--color-surface-2',
  line: '--color-line',
  ink: '--color-ink',
  ink2: '--color-ink-2',
  ink3: '--color-ink-3',
  water: '--color-water',
  waterEdge: '--color-water-edge',
  waterHi: '--color-water-hi',
  inkOnWater: '--color-ink-on-water',
}

function block(selector: string): string {
  const start = css.indexOf(selector)
  expect(start, selector).toBeGreaterThanOrEqual(0)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open, close)
}

describe('tokens.css mirrors themes.ts (spec M7 §7.2)', () => {
  it('the @theme defaults are Fundo do mar', () => {
    const b = block('@theme')
    for (const [key, name] of Object.entries(CSS_NAME) as [keyof ThemeTokens, string][]) {
      expect(b, name).toContain(`${name}: ${THEMES[DEFAULT_THEME][key]};`)
    }
  })

  it.each(THEME_IDS.filter((id) => id !== DEFAULT_THEME))('html[data-theme="%s"] overrides every token', (id) => {
    const b = block(`html[data-theme='${id}']`)
    for (const [key, name] of Object.entries(CSS_NAME) as [keyof ThemeTokens, string][]) {
      expect(b, `${id} ${name}`).toContain(`${name}: ${THEMES[id][key]};`)
    }
  })

  it('the manifest and the theme-color meta start on the default background', () => {
    const manifest = readFileSync(resolve(__dirname, '../../../public/manifest.webmanifest'), 'utf8')
    const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf8')
    const bg = THEMES[DEFAULT_THEME].bg
    expect(manifest).toContain(`"background_color": "${bg}"`)
    expect(manifest).toContain(`"theme_color": "${bg}"`)
    expect(html).toContain(`<meta name="theme-color" content="${bg}" />`)
  })
})
