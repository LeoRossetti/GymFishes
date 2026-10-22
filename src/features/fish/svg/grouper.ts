import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const G = {
  body: '#7C3C27',
  back: '#66301F',
  belly: '#D1953E',
  blotch: '#E0C78D',
  fin: '#45261C',
  finRay: '#2A150F',
  margin: '#EBD283',
  pec: '#5A2F20',
  lip: '#97513C',
  gill: '#4E2117',
  ring: '#D4A04A',
  line: '#1E0E09',
}

/**
 * Traced from two levelled side photos (an adult and a subadult): 3.2 long to deep with the tail, 2.7 without
 * (the species runs 2.6–3.1), the head 2.4 times in the body without the tail, the back highest over the pectoral,
 * a deep peduncle, the forehead sloping almost straight to thick lips, the lower jaw jutting past the upper.
 */
const EDGE =
  'M30 41.9 C34 40 40.2 36.6 48 33 C58 28.8 70 26 84 24.8 C96 24 108 25 118 27.4 C126 29.4 134 33.4 140 37.6 ' +
  'C145 41 149.2 44.6 151.6 48.2 C152.8 50 155.6 50.6 156.4 52.8 C157 54.6 156.2 56.6 154.4 57.2 L154 57.3 ' +
  'C156.2 57.2 158.2 57.6 158.7 59 C159 60.4 158.2 61.8 156.2 62.6 C152.4 64 146.4 65.4 140.6 66.8 ' +
  'C130 69.2 118 71.6 106 72.8 C94 73.8 80 72.8 68 70.4 C56 67.8 44 64 36 61.8 C33.4 61.2 31.4 60.8 30 60.6'
/** The silhouette closes behind the peduncle with no outline of its own: the tail's edges carry the line on. */
const BODY = `${EDGE} C27.8 56.4 27.8 46.2 30 41.9 Z`

const r1 = (v: number) => Math.round(v * 10) / 10

/** The same fin pulled toward (cx, cy): the dark inside of a fin, leaving the pale margin showing round its edge. */
function inset(d: string, cx: number, cy: number, k: number): string {
  let i = 0
  return d.replace(/-?\d+(\.\d+)?/g, (v) => String(r1(i++ % 2 ? cy + (Number(v) - cy) * k : cx + (Number(v) - cx) * k)))
}

/** An irregular pale blotch: seven points round (x, y) at uneven distances, joined smoothly; `tall` stretches it upright. */
function blob(x: number, y: number, r: number, tall = 1.15): string {
  const pts = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + x
    const k = 0.6 + 0.6 * Math.abs(Math.sin(x * 3.1 + y * 1.7 + i * 2.3))
    return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * tall] as const
  })
  const at = (j: number) => pts[(j + 7) % 7]!
  let d = `M${r1(at(0)[0])} ${r1(at(0)[1])}`
  for (let j = 0; j < 7; j++) {
    const [p0, p1, p2, p3] = [at(j - 1), at(j), at(j + 1), at(j + 2)]
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`
  }
  return d + ' Z'
}

/**
 * The pale marks, in upright series down the flank as in the photos: a tall irregular patch under the dorsal,
 * a rounder one below it, then small specks fading toward the golden belly; a few more on the head.
 */
const BLOTCHES: [number, number, number, number?][] = [
  [136.6, 49.8, 1.3], [128.6, 39.4, 1.5], [123.6, 46.4, 2], [124.6, 55, 1.6], [131.4, 58, 1.2],
  [118.2, 39.6, 1.7], [114, 46.6, 1.3], [116.4, 57.2, 1.3],
  [110.8, 33.4, 1.8, 1.5], [108.6, 41, 1.4], [100, 31.6, 2.5, 1.6], [97.8, 41.8, 1.6, 1.4], [97, 46.4, 0.8],
  [89.6, 30.2, 2.3, 1.8], [88.2, 40.4, 1.7, 1.2], [86.6, 46.2, 0.9], [84.2, 65.4, 0.8],
  [78.4, 33.2, 2.7, 1.45], [76.2, 42.6, 2.1, 1.3], [75.6, 48.4, 1], [77.2, 53.6, 0.8], [74.6, 58.4, 0.9], [76.4, 63.6, 0.7],
  [66.6, 32.8, 2.2, 1.75], [65.2, 43.6, 1.6, 1.4], [64.6, 49.6, 1], [66.2, 54.8, 0.8], [63.6, 59.4, 0.9], [65.4, 64.2, 0.7],
  [56.4, 37.2, 2.4, 1.4], [55.2, 46, 1.8, 1.2], [53.8, 51.2, 0.9], [55.4, 56, 0.7], [52.8, 60.2, 0.8],
  [45.6, 39.6, 1.8, 1.6], [45, 47.6, 1.5, 1.2], [44.2, 53, 0.8], [45.6, 57.4, 0.7], [37.2, 44, 1.5, 1.4], [36.4, 50.2, 1.1], [35.8, 55.2, 0.7],
  [94.4, 36.6, 0.7], [83.2, 36.8, 0.8], [72.2, 37.6, 0.7], [61.4, 39.6, 0.8], [50.6, 42.4, 0.7], [41.2, 46, 0.6],
  [82, 46, 0.7], [70.6, 47, 0.8], [59.6, 48.6, 0.7], [49.6, 51, 0.7], [71.4, 54.6, 0.7], [60.4, 56.4, 0.6], [81.4, 57.6, 0.7],
]

// Dorsal: eleven spines with notched membranes (the third and fourth longest), then the taller rounded soft part.
const TIPS: [number, number][] = [
  [112.2, 21.6], [108, 17.8], [103.8, 15.6], [99.6, 15.2], [95.4, 15.6], [91.2, 16.2], [87, 16.8], [82.8, 17.6], [78.6, 18.4], [74.4, 19.4], [70.2, 20.4],
]
/** The saw edge: each membrane drops from one spine tip to a notch just in front of the next. */
const saw = (tip: number, notch: number, dx: number) =>
  TIPS.map(([x, y], i) => {
    const notchY = Math.max(y, TIPS[i - 1]?.[1] ?? y) + notch
    return `${i ? `L${r1(x + 0.9 + dx)} ${r1(notchY)} ` : ''}L${r1(x + dx)} ${r1(y + tip)}`
  }).join(' ')
const DORSAL =
  `M118 30 L115.6 27 ${saw(0, 2.8, 0)} L67.8 22.4 C63.2 21 57.4 20.8 52 22 C44.6 23.6 38 27.8 34.4 32.8 C32.2 36 31.4 39.2 31.8 42.4 L60 34 Z`
const DORSAL_IN =
  `M118 31 L115.2 28.6 ${saw(3.4, 3.8, 0.4)} L68 24 C63.6 22.8 57.8 22.6 52.4 23.8 C45.6 25.2 39.6 28.8 36.2 33.4 C34.4 36.2 33.6 39.2 33.8 42.4 L60 35 Z`
const ANAL = 'M66 67.4 L64 69.2 C61.4 72.4 58 75.4 53.4 77 C48.6 78.4 43.4 77.6 39.8 74.2 C37 71.4 36 67.6 36.6 61.4 L50 63 Z'
const PELVIC = 'M112.4 70.8 C110.8 74.6 107 79 101.6 82.2 C99 83.6 95.8 83.6 94.2 82 C95.6 79.6 98.4 76.4 100.6 72.6 Z'
/** The pectoral's free edge: its base has no outline, it slips under the gill cover. */
const PECTORAL = 'M106.4 51.2 C100.6 49 95 47.6 90.6 47.8 C87.4 48.4 85 51.8 85 55.6 C85 58.8 86.4 61.6 89 63.2 C95.6 63.8 104.4 62.6 112.4 60.6'
/** The tail's edges leave the peduncle exactly where the body's outline stops, then flare to the rounded fin. */
const TAIL =
  'M38 44 L30 41.9 C26.4 42.8 21.4 40.4 16 37.4 C13.6 36 11.6 34.2 9.6 33 C6.6 32.2 4.6 34.6 3.8 38.4 C2.8 43 2.6 47 2.6 50 ' +
  'C2.6 53 2.8 57 3.8 61.6 C4.6 65.4 6.6 67.8 9.6 67 C11.6 66 13.6 64.8 16 63.6 C21.4 61 26.4 59.8 30 60.6 L38 58 Z'

/**
 * Garoupa — the dusky grouper (Epinephelus marginatus), the garoupa-verdadeira of the Brazilian coast. A stout
 * reddish-brown body with irregular pale blotches, golden throat and lower jaw, the big head with the lower jaw
 * jutting and the gape running back past the small high eye, the gill cover ending in its spine, the long
 * dorsal (notched spiny front with golden tips, rounded soft rear), and every fin dark with a pale edge.
 */
export const grouper: FishArt = {
  body: BODY,
  tailPivot: [33, 51],
  tail: [
    part(TAIL, G.margin, G.line),
    part(inset(TAIL, 40, 50, 0.95), G.fin),
    rays([36, 51], [[9.6, 34.6], [6, 38], [4, 43], [3.2, 50], [4, 57], [6, 62], [9.6, 65.6]], G.finRay, 0.84),
  ],
  layers: [
    part(DORSAL, G.margin, G.line),
    part(DORSAL_IN, G.fin),
    stroke(TIPS.map(([x, y], i) => `M${r1(x + 2)} ${r1(26 + i * 0.1)} L${x} ${y}`).join(' '), G.finRay, 0.8),
    rays([50, 34], [[66, 21.6], [60, 21], [54, 21.6], [48, 22.6], [42, 24.6], [37, 28], [34, 33]], G.finRay, 0.85),
    part(ANAL, G.margin, G.line),
    part(inset(ANAL, 52, 64, 0.85), G.fin),
    rays([54, 66], [[60.6, 73.6], [56, 76.4], [51, 77.4], [46, 77.2], [41.6, 75.4], [38.4, 71.6]], G.finRay, 0.8),
    part(PELVIC, G.margin, G.line),
    part(inset(PELVIC, 108, 72, 0.86), G.fin),
    part(BODY, G.body),
    stroke(EDGE, G.line, 1.6),
    // body: darker back, golden throat and lower jaw fading back along the belly, the pale blotches
    shade('M20 0 L160 0 L160 38 C150 39.4 144 38 136 35.8 C124 32.8 112 31.4 100 31.2 C80 31.4 60 34.6 44 40.2 C36 43 30 45.6 24 48 L20 48 Z', G.back),
    shade('M154.2 57 C149.2 59.4 143.8 61.6 138.4 63.6 C132 64 124 63.2 116 63 C106 63.4 96 65.8 86 68.6 C78 70.6 72 71.6 64 71 L64 92 L160 92 L160 57 Z', G.belly),
    shade(BLOTCHES.map(([x, y, r, tall]) => blob(x, y, r, tall)).join(' '), G.blotch),
    // pectoral: a dark fan with a pale edge, its base tucked behind the gill cover
    { d: `${PECTORAL} C110.6 57.6 108.2 54.2 106.4 51.2 Z`, fill: G.pec },
    stroke(PECTORAL, G.line, 1.2),
    part('M90.2 48.6 C87.2 50.4 85.8 53 85.8 55.6 C85.8 58.6 87 61 89.2 62.4 C88 60.4 87.2 58.2 87.2 55.6 C87.2 53 88.2 50.6 90.2 48.6 Z', G.margin),
    stroke('M106.8 52 L91.6 49 M107.6 53.6 L88.6 50.8 M108.6 55.4 L87.4 53.6 M109.8 57.2 L87.2 56.8 M110.8 58.8 L88 60 M111.4 60.2 L90.4 62.4', G.finRay, 0.9),
    // head: preopercle, the gill cover ending in its spine, the thick upper lip (the maxilla, reaching back past the eye)
    // over the long gape, nostril, amber iris ring
    stroke('M130.4 39 C127.8 44 127.2 51 128 56 C128.8 60.6 131 63.6 134.4 66', G.gill, 0.8),
    stroke('M121 33.4 C113.8 34.4 107.2 40.4 106.2 46 L104.7 47.2 L106 48.3 C106.8 53.4 113.2 62.2 120.4 68.4', G.gill, 1.3),
    shade('M154.2 57.5 C149.6 59.9 144 62.2 138.4 64.2 C136.8 63 136.8 60.6 138.4 59.4 C142 58 147.6 55.6 153.6 50.8 C155.2 51.2 157 52.4 158 53.8 L157 57 Z', G.lip),
    stroke('M154.2 57 C149.4 59.3 144 61.6 138.4 63.6', G.line, 1.2),
    dots([[148, 46.4, 0.7]], G.line),
    part('M139.4 45.8 A3.6 3.6 0 1 0 146.6 45.8 A3.6 3.6 0 1 0 139.4 45.8 Z', G.ring),
  ],
  eyes: [{ cx: 143, cy: 45.8, r: 2.7 }],
}
