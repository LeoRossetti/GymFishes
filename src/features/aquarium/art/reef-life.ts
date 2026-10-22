// The reef's anchor and chain (its answer to the mangrove roots), its kelp and seahorse, the jellyfish and
// the far reef, ported from the approved art reference (reef.mjs). The school is the river's (river-life.ts).
// `R` is the reef palette.
import { mixOklab, type TubeWater } from '../color'
import { nth, piece, r2, ribbonPath, samplePath, type IdSpace, type Seg } from './prims'
import type { ReefPalette } from './reef'

// ---- the anchor and its chain: the reef's answer to the mangrove roots ----------------------------
/** A sunken admiralty anchor, leaning, one fluke dug into the sand. */
export function anchor(ids: IdSpace, R: ReefPalette) {
  const c = R.iron
  const ring = '<path d="M0 -43.4 A4.2 4.2 0 1 0 0 -35 A4.2 4.2 0 1 0 0 -43.4 Z M0 -41.6 A2.4 2.4 0 1 1 0 -36.8 A2.4 2.4 0 1 1 0 -41.6 Z" ' +
    `fill="${c.base}" fill-rule="evenodd" stroke="${c.line}" stroke-width="0.8"/>`
  const shank = piece(ids, { body: 'M-2 -35.4 L2 -35.4 L2.6 -2 L-2.6 -2 Z', fill: c.base, line: c.line, width: 0.8, shades: [['M0.6 -36 L3 -36 L3 0 L0.6 0 Z', c.shade]], strokes: [['M-1 -33 L-1.3 -5', c.light, 0.6]] })
  const stock = piece(ids, { body: 'M-13 -31.6 L13 -31.6 L13 -28.6 L-13 -28.6 Z', fill: c.base, line: c.line, width: 0.8, shades: [['M-14 -30 L14 -30 L14 -28 L-14 -28 Z', c.shade]] }) +
    [-13.8, 13.8].map((x) => `<circle cx="${x}" cy="-30.1" r="2" fill="${c.base}" stroke="${c.line}" stroke-width="0.7"/>`).join('')
  const arms = piece(ids, {
    body: 'M-17 -12 C-16 -2 -8 3.2 0 3.2 C8 3.2 16 -2 17 -12 L14 -11 C13 -4 7 -0.2 0 -0.2 C-7 -0.2 -13 -4 -14 -11 Z',
    fill: c.base, line: c.line, width: 0.8, shades: [['M-18 -2 C-8 4 8 4 18 -2 L18 6 L-18 6 Z', c.shade]],
  })
  const fluke = (sx: number) => piece(ids, {
    body: `M${14.4 * sx} -10.6 L${22.5 * sx} -20.5 L${12.4 * sx} -17.4 C${12.6 * sx} -15 ${13.4 * sx} -12.6 ${14.4 * sx} -10.6 Z`,
    fill: c.base, line: c.line, width: 0.8, shades: [[`M${16 * sx} -12 L${22.5 * sx} -20.5 L${24 * sx} -12 Z`, c.shade]],
  })
  const rust = [[-1.4, -24, 0.9], [1.2, -14, 0.7], [-9, -2.4, 0.8], [10, -5, 0.6], [-11.4, -30.2, 0.6]]
    .map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${c.rust}"/>`).join('')
  const body = `<g transform="translate(122 198) rotate(10) scale(0.92)">${fluke(-1)}${fluke(1)}${arms}${shank}${stock}${ring}${rust}</g>`
  // the left fluke and the crown sink into a small heap of sand
  const s = R.sand
  const heap = piece(ids, { body: 'M101 201 C104 195.6 110 193.6 116 194.6 C121 195.4 125 197.4 129 200.6 Z', fill: s.base, line: s.line, width: 0.7, shades: [['M101 199 L129 199 L129 202 L101 202 Z', s.shade]] })
  return body + heap
}

/** The chain's path: from above the water down to the anchor's ring, with a slight sag. */
const CHAIN: Seg[] = [[[141, -8], [138, 50], [121, 112], [125.4, 157.4]]]

type Link = { x: number; y: number; a: number }

/** Chain links along the path: face-on rings and side-on bars alternate, like a real chain. */
export function chain(R: ReefPalette) {
  const c = R.iron
  const pts = samplePath(CHAIN, 80)
  const links: Link[] = []
  let acc = 0, next = 0
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = nth(pts, i - 1), [x1, y1] = nth(pts, i)
    const d = Math.hypot(x1 - x0, y1 - y0)
    while (acc + d >= next) {
      const f = (next - acc) / d
      links.push({ x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, a: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI })
      next += 4.7
    }
    acc += d
  }
  const at = (l: Link, inner: string) => `<g transform="translate(${r2(l.x)} ${r2(l.y)}) rotate(${r2(l.a - 90)})">${inner}</g>`
  const face = links.filter((_, i) => i % 2 === 0).map((l, i) => at(l,
    `<path d="M0 -3.5 A2.2 3.5 0 1 0 0 3.5 A2.2 3.5 0 1 0 0 -3.5 Z M0 -2.1 A0.85 2.1 0 1 1 0 2.1 A0.85 2.1 0 1 1 0 -2.1 Z" fill="${i % 5 === 3 ? mixOklab(c.base, c.rust, 0.45) : c.base}" fill-rule="evenodd" stroke="${c.line}" stroke-width="0.55"/>` +
    `<path d="M-1.5 -2.2 C-1.6 -1 -1.6 0.6 -1.5 1.6" fill="none" stroke="${c.light}" stroke-width="0.45" stroke-linecap="round"/>`)).join('')
  const side = links.filter((_, i) => i % 2 === 1).map((l) => at(l,
    `<rect x="-0.95" y="-3.5" width="1.9" height="7" rx="0.95" fill="${c.shade}" stroke="${c.line}" stroke-width="0.55"/>`)).join('')
  return face + side
}

// ---- life on the reef --------------------------------------------------------------------------
/** Kelp: a wavy stipe with long blades on alternating sides, a small bladder at each blade's base. */
function kelpPlant(ids: IdSpace, R: ReefPalette, x: number, y: number, h: number, lean: number, seed: number) {
  const c = R.kelp
  const stipe: Seg[] = [[[x, y], [x + lean * 0.3 + 3, y - h * 0.35], [x + lean * 0.7 - 3, y - h * 0.7], [x + lean, y - h]]]
  const pts = samplePath(stipe, 40)
  let out = piece(ids, { body: ribbonPath(stipe, (t) => 1.8 - 0.6 * t), fill: c.shade, line: c.line, width: 0.5 })
  for (let k = 0; k < 7; k++) {
    const i = Math.round(((k + 1) / 8) * (pts.length - 1)), p = nth(pts, i)
    const side = k % 2 ? 1 : -1, len = 11 + ((seed * 7 + k * 5) % 6)
    const segs: Seg[] = [[[p[0], p[1]], [p[0] + side * len * 0.35, p[1] - len * 0.25], [p[0] + side * len * 0.7, p[1] - len * 0.55 + 2], [p[0] + side * len * 0.95, p[1] - len * 0.8]]]
    out += piece(ids, { body: ribbonPath(segs, (t) => 3.6 * Math.sin(Math.PI * (0.15 + t * 0.85)) + 0.4), fill: k % 3 === 1 ? c.light : c.base, line: c.line, width: 0.55 })
    out += `<circle cx="${r2(p[0] + side * 1.2)}" cy="${r2(p[1] - 0.6)}" r="1.25" fill="${c.bladder}" stroke="${c.line}" stroke-width="0.45"/>`
  }
  return out
}
export function kelp(ids: IdSpace, R: ReefPalette) {
  return kelpPlant(ids, R, 13, 196, 118, 4, 1) + kelpPlant(ids, R, 5, 194, 96, 8, 2)
}

/** A small seahorse holding the kelp with its tail. */
export function seahorse(ids: IdSpace, R: ReefPalette, x: number, y: number, s: number) {
  const c = R.horse
  const body = 'M5.2 1.2 C7 0.2 9 0.6 9.6 2.4 L13.6 3.2 C14 3.5 14 4.4 13.6 4.6 L9.8 5.2 C10.8 7.4 10.6 10.4 8.8 12.6 C7.6 14 5.6 14.2 4.4 13 C3.4 11.6 4 9.8 4.2 8.4 C3.2 7.6 2.8 6 3.2 4.6 C3.4 3 4 1.8 5.2 1.2 Z'
  const tail = ribbonPath([[[5.4, 12.8], [4.4, 15.6], [6.2, 18.6], [7.8, 17.2]], [[7.8, 17.2], [8.8, 16], [7.2, 15.2], [6.6, 16.4]]], (t) => 2.2 - 1.6 * t)
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    piece(ids, { body: tail, fill: c.base, line: c.line, width: 0.5 }) +
    piece(ids, { body: 'M4.2 8.6 C2.4 8.4 1.8 10 2.2 11.4 L4 10.8 Z', fill: c.light, line: c.line, width: 0.4 }) +
    piece(ids, { body, fill: c.base, line: c.line, width: 0.55, shades: [['M3 6 C5 8 6 11 5 14 L2 14 L2 6 Z', c.shade]],
      strokes: [['M5.2 8.8 L8.6 9.4', c.shade, 0.4], ['M5 10.4 L8.2 10.8', c.shade, 0.4], ['M5.4 12 L7.6 12.2', c.shade, 0.4], ['M5.6 1.4 L5.2 0.2 M6.8 0.7 L6.8 -0.4 M8 0.8 L8.4 -0.2', c.line, 0.4]] }) +
    `<circle cx="8.1" cy="2.9" r="0.75" fill="${R.eye}"/></g>`
}

/** A small moon jellyfish drifting: a pale bell with four lilac rings and trailing tentacles. */
export function jelly(x: number, y: number, s: number, deg: number, water: TubeWater) {
  const bell = mixOklab(water.fill, '#FFFFFF', 0.42), rim = mixOklab(water.fill, '#FFFFFF', 0.7), ring = mixOklab(water.fill, '#D7A6E0', 0.62)
  const tent = [-4.6, -2, 1, 3.8].map((tx, i) => `M${tx} 0.6 C${tx - 1.4} 4 ${tx + 1.4} 7 ${tx - 0.6} ${10 + (i % 2) * 2}`).join(' ')
  return `<g transform="translate(${x} ${y}) rotate(${deg}) scale(${s})">` +
    `<path d="${tent}" fill="none" stroke="${rim}" stroke-width="0.5" stroke-linecap="round"/>` +
    `<path d="M-2.2 0.6 C-2.6 3 -1.4 5 -2 7 M2 0.6 C2.6 3 1.6 5 2.2 7" fill="none" stroke="${bell}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="M-6 0.6 C-6 -5.6 6 -5.6 6 0.6 C4.6 1.4 3.4 0.4 2 1.2 C0.6 0.4 -0.6 1.4 -2 0.8 C-3.4 1.4 -4.6 0.4 -6 0.6 Z" fill="${bell}" stroke="${rim}" stroke-width="0.6"/>` +
    [[-2.2, -1.8], [0, -2.8], [2.2, -1.8]].map(([rx, ry]) => `<circle cx="${rx}" cy="${ry}" r="0.95" fill="none" stroke="${ring}" stroke-width="0.6"/>`).join('') + '</g>'
}

/** The far reef: coral heads and kelp as silhouettes in one tone a step darker than the water. */
export function farReef(water: TubeWater) {
  const tone = mixOklab(water.fill, '#0A1421', 0.24)
  const heads = 'M28 200 C28 190 34 184 40 186 C42 178 50 174 56 179 C60 172 70 172 72 180 C78 176 86 178 87 186 C92 182 100 184 101 192 C106 190 112 194 112 200 Z'
  const frondPaths: Seg[][] = [[[[36, 198], [40, 170], [30, 140], [36, 108]]], [[[60, 198], [56, 172], [66, 150], [60, 124]]]]
  const fronds = frondPaths.map((segs) => ribbonPath(segs, (t) => 4 * (1 - 0.4 * t)))
  return [...fronds, heads].map((d) => `<path d="${d}" fill="${tone}"/>`).join('')
}
