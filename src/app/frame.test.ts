import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

describe('app frame (spec M7 §4)', () => {
  const html = read('../../index.html')
  const css = read('../styles/globals.css')

  it('the viewport meta disables zoom in the installed app and covers the safe areas', () => {
    const meta = /<meta name="viewport" content="([^"]+)"/.exec(html)?.[1] ?? ''
    for (const part of ['width=device-width', 'initial-scale=1', 'maximum-scale=1', 'user-scalable=no', 'viewport-fit=cover']) {
      expect(meta).toContain(part)
    }
  })

  it('the document never scrolls; only .scroll-region does', () => {
    expect(css).toMatch(/html,\s*body\s*{[^}]*overflow:\s*hidden/)
    expect(css).toMatch(/\.scroll-region\s*{[^}]*overflow-y:\s*auto/)
    expect(css).toMatch(/\.scroll-region\s*{[^}]*overscroll-behavior:\s*contain/)
    expect(css).toMatch(/\.scroll-region\s*{[^}]*overflow-x:\s*hidden/)
  })

  it('double-tap zoom is off for the whole page', () => {
    expect(css).toMatch(/html\s*{[^}]*touch-action:\s*manipulation/)
  })
})
