// Records each full-screen celebration (unlock, record, streak) on an iPhone 14 viewport with
// Playwright's WebKit into .tmp/celebracoes/: a strip of frames at fixed moments, the raw video,
// and a GIF of the animation. The GIF needs Python with Pillow (Playwright's ffmpeg only writes
// video and PNG sequences); without it you still get the strip and the .webm.
// Usage: npm run celebration:shots -- unlock
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { devices, webkit } from '@playwright/test'

const ALL = ['unlock', 'record', 'streak']
const FRAMES_MS = [0, 150, 300, 500, 800, 1200, 2000]
const OUT = '.tmp/celebracoes'
const PORT = 4174
const SIZE = { width: 390, height: 844 }
const FPS = 12

/** Playwright ships ffmpeg for its own video recording; we borrow it to split the .webm into frames. */
function ffmpegPath() {
  const roots = process.env.PLAYWRIGHT_BROWSERS_PATH
    ? [process.env.PLAYWRIGHT_BROWSERS_PATH]
    : [
        join(process.env.LOCALAPPDATA ?? '', 'ms-playwright'),
        join(homedir(), 'Library', 'Caches', 'ms-playwright'),
        join(homedir(), '.cache', 'ms-playwright'),
      ]
  for (const root of roots) {
    if (!root || !existsSync(root)) continue
    for (const dir of readdirSync(root)) {
      if (!dir.startsWith('ffmpeg-')) continue
      for (const name of ['ffmpeg-win64.exe', 'ffmpeg-mac-arm64', 'ffmpeg-mac', 'ffmpeg-linux']) {
        const p = join(root, dir, name)
        if (existsSync(p)) return p
      }
    }
  }
  return null
}

/** Frames → GIF with one shared palette and no dithering, so the flat colours stay crisp. */
const PILLOW_GIF = `
import os, sys
from PIL import Image
src, dst, ms = sys.argv[1], sys.argv[2], int(sys.argv[3])
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
rgb = [Image.open(os.path.join(src, f)).convert('RGB') for f in files]
palette = rgb[-1].quantize(colors=255, method=Image.Quantize.MEDIANCUT)
frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in rgb]
frames[0].save(dst, save_all=True, append_images=frames[1:], duration=ms, loop=0)
`

async function record(browser, kind) {
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    viewport: SIZE,
    recordVideo: { dir: OUT, size: SIZE },
  })
  const created = Date.now()
  const page = await context.newPage()
  await page.goto(`http://localhost:${PORT}/scripts/celebration-shots.html?kind=${kind}`)
  await page.waitForFunction(() => typeof window.__start === 'function')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await page.evaluate(() => window.__start())
  const t0 = Date.now()
  const frames = []
  for (const ms of FRAMES_MS) {
    const wait = t0 + ms - Date.now()
    if (wait > 0) await page.waitForTimeout(wait)
    const file = join(OUT, `${kind}-${String(ms).padStart(4, '0')}ms.png`)
    await page.screenshot({ path: file })
    frames.push({ ms, file })
  }
  await page.waitForTimeout(600)
  const video = page.video()
  await context.close()
  const webm = join(OUT, `${kind}.webm`)
  renameSync(await video.path(), webm)
  return { webm, frames, startsAt: Math.max(0, (t0 - created) / 1000 - 0.1) }
}

async function strip(browser, kind, frames) {
  const page = await browser.newPage({ viewport: { width: frames.length * 212 + 28, height: 500 }, deviceScaleFactor: 1 })
  const cells = frames
    .map(
      (f) =>
        `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(f.file).toString('base64')}" width="200" style="display:block;border-radius:12px;border:1px solid #32496A">` +
        `<figcaption style="text-align:center;margin-top:6px">${f.ms} ms</figcaption></figure>`,
    )
    .join('')
  await page.setContent(
    `<html><body style="margin:0;padding:14px;background:#0A1421;display:flex;gap:12px;font:700 13px system-ui;color:#F2F7FB">${cells}</body></html>`,
  )
  const file = join(OUT, `${kind}-frames.png`)
  await page.screenshot({ path: file, fullPage: true })
  await page.close()
  return file
}

function gif(ffmpeg, kind, webm, startsAt) {
  const dir = join(OUT, `${kind}-video-frames`)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const split = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(startsAt), '-i', webm, '-r', String(FPS), join(dir, 'f-%03d.png')])
  if (split.status !== 0) return `ffmpeg falhou para ${kind}: ${split.stderr}`
  const file = join(OUT, `${kind}.gif`)
  const py = spawnSync('python', ['-c', PILLOW_GIF, dir, file, String(Math.round(1000 / FPS))], { encoding: 'utf8' })
  rmSync(dir, { recursive: true, force: true })
  return py.status === 0 ? file : `GIF pulado (precisa de Python com Pillow): ${py.stderr.trim().split('\n').pop()}`
}

const kinds = process.argv.slice(2).filter((k) => ALL.includes(k))
mkdirSync(OUT, { recursive: true })
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await webkit.launch()
const ffmpeg = ffmpegPath()
try {
  for (const kind of kinds.length ? kinds : ALL) {
    const { webm, frames, startsAt } = await record(browser, kind)
    const out = [await strip(browser, kind, frames), webm]
    out.push(ffmpeg ? gif(ffmpeg, kind, webm, startsAt) : 'GIF pulado (ffmpeg do Playwright não encontrado)')
    console.log(out.join('\n'))
  }
} finally {
  await browser.close()
  await server.close()
}
