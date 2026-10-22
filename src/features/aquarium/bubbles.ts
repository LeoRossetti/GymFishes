// The animated bubbles, ported from the approved reference (`bubbleField` in
// docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs). Each source lets out a small seeded burst once
// per period. Keyframe names derive from `prefix`, so two tubes on one page never collide.
import type { TubeWater } from './color'
import { bubble, r2, type BubbleSource } from './art/prims'

export const BUBBLE_PERIOD = 8

/** The bubbles for a tube whose water surface sits at `surfaceY` (scene px): the keyframes and the markup. */
export function bubbleField(
  ml: number,
  water: TubeWater,
  surfaceY: number,
  sources: readonly BubbleSource[],
  prefix: string,
): { css: string; svg: string } {
  let css = ''
  let svg = ''
  sources
    .filter((src) => ml >= src.at)
    .forEach((src, si) => {
      let r = src.seed * 7919
      const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
      const t0 = rnd() * BUBBLE_PERIOD
      let lag = 0
      for (let k = 0; k < src.n; k++) {
        const rad = r2(1.5 + rnd() * 1.5)
        const speed = 30 + rad * 6
        const x = r2(src.x + (rnd() - 0.5) * 3)
        const rise = r2(src.y - (surfaceY + 6))
        if (rise <= 6) continue
        const f = Math.min(99, (rise / speed / BUBBLE_PERIOD) * 100)
        const start = r2((t0 + lag) % BUBBLE_PERIOD)
        lag += 0.35 + rnd() * 0.5
        const up = `${prefix}u${si}${k}`
        const side = `${prefix}s${si}${k}`
        const amp = r2(0.6 + rnd() * 1.2)
        css +=
          `@keyframes ${up}{0%{transform:translateY(0) scale(.8);opacity:0}${r2(f * 0.06)}%{opacity:1}${r2(f * 0.9)}%{opacity:1}` +
          `${r2(f)}%{transform:translateY(${-rise}px) scale(1.12);opacity:0}100%{transform:translateY(${-rise}px) scale(1.12);opacity:0}}` +
          `@keyframes ${side}{from{transform:translateX(${-amp}px)}to{transform:translateX(${amp}px)}}`
        svg +=
          `<g class="aq-bubble" style="opacity:0;transform-box:fill-box;transform-origin:center;animation:${up} ${BUBBLE_PERIOD}s linear ${start}s infinite">` +
          `<g style="animation:${side} ${r2(0.8 + rnd() * 0.7)}s ease-in-out ${r2(-rnd())}s infinite alternate">${bubble(x, src.y, rad, water)}</g></g>`
      }
    })
  return { css, svg }
}
