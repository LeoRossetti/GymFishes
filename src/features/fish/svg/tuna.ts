import { part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const A = {
  back: '#1B2B5E',
  blue: '#3F8BE6',
  gold: '#F2C12E',
  flank: '#B7C3D3',
  belly: '#E8EDF2',
  stripe: '#DCE4EE',
  plate: '#7D8AA3',
  fin: '#F5C41F',
  finRay: '#C79A14',
  dusky: '#B09C4C',
  duskyRay: '#6A5C2A',
  pec: '#2F4174',
  pecRay: '#1A2650',
  tail: '#2E3B60',
  tailRay: '#1A2444',
  keel: '#121A3A',
  ring: '#D8C77E',
  line: '#0B1431',
}

/**
 * Traced from flat side photos (iNaturalist): a torpedo about 3.5:1 to the fork (deepened a touch from the
 * photos' 3.6–3.9, as big adults are), deepest under the first dorsal, a pointed snout with the eye level with
 * the jaw tips, the pale lower jaw a little ahead of the dark upper one, the head 27% of the length, a
 * pencil-thin tail stock (thickened slightly to read small). The sickle fins are a big adult's, a bit shorter
 * than the longest photos so they stay in the box.
 */
const BODY =
  'M22 47.6 C30 47 38 45 46 42.4 C56 38.8 66 34.8 78 31.8 C90 29.4 104 29.6 118 31.2 C127 32.2 137 34.4 145.4 38.2 ' +
  'C150.6 40.8 154.6 44.2 156.6 46.8 C157 47.3 156.9 47.7 156.4 47.9 L155 48.4 C156.4 48.2 157.8 48.3 158.3 48.8 ' +
  'C158.6 49.4 157.8 50.4 156.4 51 C151.6 53.2 146 55.6 140 57.8 C130 61.8 118 66 104 68.2 ' +
  'C92 69.6 82 68.2 72 64.4 C60 59.6 46 54.4 34 51.6 C30 50.8 26 50.6 22 50.5 C20.8 50.2 20.6 48 22 47.6 Z'

/** The back and belly edges, sampled from BODY: the finlets sit on them. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [22, 47.6, 50.5], [30, 46.6, 51], [36, 45.3, 52.1], [42, 43.7, 53.7], [48, 41.7, 55.6], [54, 39.5, 57.6], [60, 37.3, 59.8], [66, 35.3, 62], [72, 33.4, 64.4],
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

/** The finlets: little yellow flags along the back and belly of the tail stock, each base tucked under the body. */
function finlets(xs: readonly number[], side: 0 | 1): string {
  const out = side === 0 ? -1 : 1
  return xs
    .map((x) => {
      const s = 0.8 + 0.2 * ((x - 32) / 36)
      const pt = (u: number, lift: number) => `${r1(u)} ${r1(edgeAt(u)[side] + out * lift)}`
      return `M${pt(x + 1.7 * s, -0.8)} L${pt(x - 2.6 * s, 3.9 * s)} L${pt(x - 1.5 * s, -0.8)} Z`
    })
    .join(' ')
}

/** The broken near-vertical lines on the silver flank, leaning forward at the bottom. */
const LINES: Layer = (() => {
  const segs: string[] = []
  for (let i = 0; i < 16; i++) {
    const x = 112 - i * 3.8
    for (let y = 42 + (i % 2) * 1.7; y < 64; y += 3.4) segs.push(`M${r1(x + (y - 42) * 0.12)} ${r1(y)} l0.26 2.2`)
  }
  return { d: segs.join(' '), fill: 'none', stroke: A.stripe, strokeWidth: 0.75, clip: true }
})()

/**
 * Atum (albacora-laje, yellowfin tuna) — the ocean sprinter. Dark metallic blue back, a golden band down the
 * side, silver flanks crossed by broken pale lines; the long yellow sickle second dorsal and anal fins, the row
 * of yellow finlets edged in black, the keel on the tail stock and the tall crescent tail; a low spiny first
 * dorsal, the long pectoral, the big eye under the dark cap and the small mouth at the point of the snout.
 */
export const tuna: FishArt = {
  body: BODY,
  tailPivot: [24, 49],
  tail: [
    part('M30 47.6 L24.4 47.6 C22.6 40.6 14 30.6 4 25.4 C8 33 13.6 41.6 19.2 49.1 C13.6 56.8 8.6 65.6 6.6 74 C15.6 68 22.6 57.8 24.4 50.6 L30 50.6 Z', A.tail, A.line),
    rays([24, 49], [[8.4, 29.6], [10, 68.6]], A.tailRay, 0.85, 0.7),
  ],
  layers: [
    // first dorsal (low, spiny), the yellow sickle second dorsal and anal, pelvic, the finlets
    part('M114.6 31.4 C113.2 28.6 112 26 111 23.6 C107 25.2 100 27 93.4 28.4 C90.6 29 88.2 29.6 85.8 30.6 Z', A.dusky, A.line, 1.2),
    rays([113, 31], [[111.2, 24.4], [106.8, 25.8], [101.8, 27], [96.8, 28.2], [91.8, 29.2]], A.duskyRay, 0.9, 0.7),
    part('M82.8 31.2 C80.2 26.8 76.2 22.8 70.4 20.4 C63 17.6 53 17.2 42 17.8 C52 19.6 60.4 21.6 66 24 C70 25.8 72.8 28.8 73.8 33 Z', A.fin, A.line, 1.3),
    part('M73.8 64.8 C71.6 69.6 67.4 73.6 61.4 76.2 C55 79 47.6 80.6 40.6 81.6 C47.4 79.2 53.6 76.6 58.4 73.8 C62.4 71.4 64.8 67.8 65.8 62 Z', A.fin, A.line, 1.3),
    part('M116.6 65.6 C112.6 68.4 108.4 70.8 103.6 73 C106 70.6 108 68.4 109.4 66.6 Z', A.dusky, A.line, 1.2),
    part(finlets([68.2, 63.8, 59.4, 55.2, 51, 47, 43, 39.2, 35.4], 0), A.fin, A.line, 0.55),
    part(finlets([62, 57.8, 53.6, 49.6, 45.6, 41.8, 38, 34.4], 1), A.fin, A.line, 0.55),
    part(BODY, A.flank, A.line),
    // body: the broken pale lines on the silver, the pale belly, the gold band, the dark metallic back, the keel
    LINES,
    shade('M14 50.6 C34 52 52 55.4 70 58.6 C86 61.2 100 61.4 114 59.8 C128 58 138 55 144 52.6 C147 51.4 151 50 155 48.8 L162 48.6 L162 80 L14 80 Z', A.belly),
    shade('M18 50 C40 48.4 62 47.2 84 46.6 C104 46 120 45 131 43.8 C135.6 43 138.6 41.8 140.6 40.6 L140.6 30 L18 30 Z', A.gold),
    { ...stroke('M24 48.8 C32 47.7 46 46 64 43.5 C80 41.5 96 40.6 112 40.2 C122 40 130 40.2 136 40.6', A.blue, 0.8), clip: true },
    shade('M18 49.2 C30 47.9 46 45.6 64 42.9 C80 40.9 96 40 112 39.6 C124 39.4 134 39.6 141 40.2 C146 40.8 150.6 43 153.6 45.4 C155.4 46.8 156.6 47.8 158 48.6 L160 48.6 L160 20 L18 20 Z', A.back),
    shade('M37 49.3 C31 48.1 25.6 48.1 21 48.8 C25.6 50 31 50.5 37 49.3 Z', A.keel),
    // head: the softer preopercle, the long pectoral, the gill-cover edge over its base
    stroke('M139.4 48 C136.4 51.4 135.2 55.6 135.8 59.8', A.plate, 0.7),
    part('M119.8 46.8 C108 44.6 95 44.4 81 46.4 C90 47 99 48.2 106 49.6 C111 50.6 115.6 51.8 119.8 52 Z', A.pec, A.line, 1.2),
    rays([120, 49.4], [[88, 46.4], [100, 47.8]], A.pecRay, 0.85, 0.6),
    stroke('M122.6 39.8 C119.4 44.6 119.2 53 122.4 64.2', A.plate, 1.2),
    // mouth: the cleft running back from the notch to below the front of the eye; iris ring
    stroke('M155 48.4 C152.6 49.1 150 49.9 147.6 50.8', A.line, 1.1),
    part('M139.1 45.2 A4.2 4.2 0 1 0 147.5 45.2 A4.2 4.2 0 1 0 139.1 45.2 Z', A.ring),
  ],
  eyes: [{ cx: 143.3, cy: 45.2, r: 3.4 }],
}
