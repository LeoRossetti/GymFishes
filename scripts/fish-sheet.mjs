// Renders every fish (or the ids given as arguments) at 320/160/56px plus the locked silhouette
// to .tmp/fish-sheet.png with Playwright's WebKit. Usage: npm run fish:sheet -- betta guppy
import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { webkit } from '@playwright/test'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { renderSheet } = await server.ssrLoadModule('/scripts/fish-sheet.entry.tsx')
  const html = renderSheet(process.argv.slice(2))
  mkdirSync('.tmp', { recursive: true })
  writeFileSync('.tmp/fish-sheet.html', html)
  const browser = await webkit.launch()
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 })
  await page.setContent(html)
  await page.screenshot({ path: '.tmp/fish-sheet.png', fullPage: true })
  await browser.close()
  console.log('.tmp/fish-sheet.png')
} finally {
  await server.close()
}
