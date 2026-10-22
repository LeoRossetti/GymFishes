import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const M = {
  back: '#147F86',
  green: '#A8C93A',
  flank: '#F1CB2F',
  belly: '#F7EDB5',
  blue: '#2C64D2',
  dark: '#21364A',
  sail: '#1C9C93',
  sailRay: '#0E5F60',
  sailSpot: '#62B8F7',
  fin: '#E9C030',
  finRay: '#A8811A',
  pec: '#D7C23A',
  tail: '#E7BC2A',
  tailRay: '#A07D16',
  plate: '#A08A1E',
  ring: '#B39424',
  line: '#0B2B30',
}

/**
 * Traced from side photos of bulls (iNaturalist: flat on deck and swimming; the adult-male plate): about 3.7:1 to
 * the fork (bulls on deck measure 3.8–4, swimming ones 3.4–3.6), deepest just behind the head, the crown the
 * highest point and the steep square forehead dropping almost straight to the small mouth at its foot, the lower
 * jaw a little past the upper, the throat sloping back; the head 18% of the length, the eye 12 units behind the
 * forehead and low, just above the end of the gape; the body tapering to a narrow tail stock that runs into the fork.
 */
const BODY =
  'M36 47.4 C40 45.8 46 43.4 52 41.4 C62 38.2 72 35.8 82 34.2 C96 32.2 110 30.8 124 30.2 C132 29.9 139 29.7 145 29.8 ' +
  'C150.4 30 154 31.6 156 34.8 C157.2 37 157.5 40.6 157.5 44.6 C157.5 47.8 157.3 50.6 156.8 52.4 ' +
  'L155.2 53.4 C156.6 53.3 157.9 53.5 158.3 54.1 C158.6 54.8 157.9 55.8 156.6 56.4 C153.6 57.8 149.6 59.6 145 61 ' +
  'C138 63 130 65 122 65.8 C110 66.6 98 65.6 88 63.6 C76 61.4 62 59.4 50 57.6 C44 56.6 39.6 55.6 36 55.2 ' +
  'C33.6 54.8 31 53.4 29.6 52 C29.2 51.6 29.2 51.2 29.6 50.8 C31 49.4 33.6 47.8 36 47.4 Z'

/** The back and belly edges, sampled from BODY: the spots and the fin rays sit on them. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [36, 47.4, 55.2], [40, 45.8, 55.8], [45, 43.9, 56.7], [50, 42.1, 57.6], [60, 39, 59.1], [70, 36.5, 60.6], [80, 34.5, 62.2],
  [90, 33.1, 64], [100, 32, 65.4], [110, 31.1, 66], [120, 30.4, 65.9], [128, 30.1, 65],
]
function edgeAt(x: number): [number, number] {
  for (let i = 1; i < EDGE.length; i++) {
    const a = EDGE[i - 1]!
    const b = EDGE[i]!
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0])
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    }
  }
  const last = EDGE[EDGE.length - 1]!
  return [last[1], last[2]]
}

const r1 = (v: number) => Math.round(v * 10) / 10
const jitter = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

/** `n` spots scattered over a band of the body (fractions f0–f1 of the depth), one per slice so they spread evenly. */
function spots(n: number, f0: number, f1: number, seed: number): [number, number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const x = 42 + ((i + jitter(seed + i)) * 84) / n
    const [top, bottom] = edgeAt(x)
    const f = f0 + (f1 - f0) * jitter(seed + i * 3.7 + 0.5)
    return [r1(x), r1(top + (bottom - top) * f), r1((0.42 + 0.3 * jitter(seed + i * 1.3)) * (0.75 + 0.25 * ((x - 42) / 84)))]
  })
}

/** Fin rays: short strokes from inside the body edge out toward the fin margin, leaning back. */
function finRays(xs: readonly number[], side: 0 | 1, reach: (x: number) => number, lean: number, color: string): Layer {
  const out = side === 0 ? -1 : 1
  const d = xs
    .map((x) => `M${r1(x)} ${r1(edgeAt(x)[side] - out * 0.6)} L${r1(x - lean)} ${r1(edgeAt(x - lean)[side] + out * reach(x))}`)
    .join(' ')
  return { d, fill: 'none', stroke: color, strokeWidth: 0.6 }
}

/**
 * Dourado-do-mar (mahi-mahi, Coryphaena hippurus), the adult bull — the blue-water sprinter. Teal back and a
 * blue-green dorsal sail from the top of the head almost to the tail, golden flanks scattered with small blue
 * and dark spots, a pale yellow belly and lower jaw; the steep square forehead, the small mouth at its foot with
 * the lower jaw just ahead, the eye low near the mouth, the long anal fin and the deeply forked yellow tail.
 */
export const mahimahi: FishArt = {
  body: BODY,
  tailPivot: [34, 51.3],
  tail: [
    part('M40 47.8 L36 47.4 C29 45.4 18 37.6 4.6 28.6 C9.6 35.8 16.6 44.6 26.4 51.3 C16.6 58 10 66.2 5.4 73.6 C18.6 64.8 29 57.2 36 55.2 L40 55.4 Z', M.tail, M.line),
    rays([31, 51.3], [[8.4, 31.4], [15, 39], [15.2, 63.2], [8.8, 70.6]], M.tailRay, 0.85, 0.7),
  ],
  layers: [
    // the dorsal sail from the top of the head to the tail stock, the long anal fin, the pelvic
    part('M148.4 33.6 C146.8 30.4 144.8 26 142.4 22.2 C141 20.2 139.2 19.2 136.6 19.2 C126 19.6 112 21.4 100 23.6 C86 26.2 72 30 60 33.6 C52 36.2 45 39.8 40.4 43.4 C38.6 44.8 37.6 46.2 37.8 47.4 L42.6 46.6 C60 42.2 90 36 120 33.4 Z', M.sail, M.line, 1.3),
    finRays([140, 134, 128, 122, 116, 110, 104, 98, 92, 86, 80, 74, 68, 62, 56, 50, 45], 0, (x) => 2.6 + (x - 44) * 0.058, 2, M.sailRay),
    dots([[137, 26.4, 0.6], [131, 23.7, 0.6], [125, 26.6, 0.6], [119, 24.4, 0.6], [113, 27.9, 0.55], [107, 26, 0.55], [101, 28.8, 0.55], [95, 27.8, 0.55], [89, 30.8, 0.5], [83, 30, 0.5], [77, 32.8, 0.5], [71, 32.8, 0.5], [65, 35.7, 0.45], [59, 36.2, 0.45], [53, 39.2, 0.45]], M.sailSpot),
    part('M90 62.6 C88.8 64.8 87 67.6 84.4 69.8 C83.6 70.5 82.6 70.2 82.4 69.4 C74 67.4 62 64.8 52 62.2 C46 60.8 41.4 58.8 38.8 56.8 C38 56.2 37.8 55.6 38 55 L44 55.2 C60 57.4 76 59.6 90 62.6 Z', M.fin, M.line, 1.3),
    finRays([86, 80, 74, 68, 62, 56, 50, 45], 1, (x) => 2.2 + (x - 44) * 0.06, 1.8, M.finRay),
    part('M131.6 63.2 C128.8 67.6 124.4 72.2 118.8 76.4 C117.8 77.1 117 76.4 117.6 75.6 C120.6 71.6 122.6 67.4 123.6 63.8 Z', M.fin, M.line, 1.3),
    part(BODY, M.flank, M.line),
    // body: the pale belly and lower jaw, the yellow-green band, the teal back, the spots
    shade('M30 56.2 C38 55.8 46 56.2 56 57 C68 57.8 80 58.4 92 58.9 C108 59.4 122 59.6 132 58.8 C138 58.2 143 56.4 148.2 54.9 C150.6 54.3 153 53.9 155.2 53.7 L160 53.7 L160 86 L30 86 Z', M.belly),
    shade('M30 47.6 C36 48.6 44 48.8 52 48.4 C64 47.8 76 47.4 88 46.8 C104 46.2 120 45.8 134 45 C142 44.4 150 43 160 41.8 L160 0 L30 0 Z', M.green),
    shade('M30 46 C36 46.8 44 46.4 52 45.6 C64 44.4 76 43 88 41.9 C104 40.6 120 40 134 39.2 C142 38.6 150 37 160 36 L160 0 L30 0 Z', M.back),
    dots(spots(40, 0.18, 0.7, 3), M.blue, true),
    dots(spots(18, 0.36, 0.76, 11), M.dark, true),
    // head: the softer preopercle, the pectoral, the gill-cover edge over its base
    stroke('M141.8 42.4 C139.4 47.4 139.6 54.2 142.8 58.8', M.plate, 0.7),
    part('M129.4 50.2 C123.6 47.6 116.6 46.8 109.2 47.6 C108.4 47.8 108.6 48.6 109.4 48.6 C115.8 49.4 121.6 51.4 126.8 53.8 C128.8 54.6 130.6 51.8 129.4 50.2 Z', M.pec, M.line, 1.2),
    rays([128.6, 52], [[111.6, 47.8], [117, 49.4]], M.finRay, 0.85, 0.6),
    stroke('M136.6 37.4 C131.4 42.6 130.4 53.6 133.8 63', M.plate, 1.2),
    // mouth: the cleft running back from the notch to just ahead of the eye; nostril; iris ring
    stroke('M155.2 53.4 C152.8 53.6 150.6 53.9 148.2 54.2', M.line, 1.1),
    dots([[150.4, 46.4, 0.6]], M.line),
    part('M142.1 49 A3.1 3.1 0 1 0 148.3 49 A3.1 3.1 0 1 0 142.1 49 Z', M.ring),
  ],
  eyes: [{ cx: 145.2, cy: 49, r: 2.4 }],
}
