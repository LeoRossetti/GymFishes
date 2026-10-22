import { part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const B = {
  body: '#2A49C2',
  head: '#20389E',
  gill: '#142A80',
  scale: '#2643B6',
  scaleFaint: '#2847BD',
  fin: '#3768E0',
  fold: '#2A55C8',
  finRay: '#C42A4C',
  red: '#D3304E',
  redFold: '#B5223F',
  redRay: '#86152F',
  pelvic: '#C8213F',
  tip: '#F7F2F4',
  pec: '#6F98EC',
  pecRay: '#3F67CC',
  ring: '#5B8BF0',
  line: '#0E1C55',
}

type P = readonly [number, number]
const r1 = (v: number) => Math.round(v * 10) / 10
const pt = (p: P) => `${r1(p[0])} ${r1(p[1])}`
const at = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
/** A quadratic from a to b, its middle pushed sideways by `f` of the a→b length (the sign picks the side). */
const bow = (a: P, b: P, f: number) => {
  const m = at(a, b, 0.5)
  return ` Q${pt([m[0] + (b[1] - a[1]) * f, m[1] - (b[0] - a[0]) * f])} ${pt(b)}`
}

/** Through `tips`, each span bulging `bulge` away from `o`: a ruffled fin edge, one fold between two rays. */
function edge(o: P, tips: readonly P[], bulge: number): string {
  let d = ''
  for (let i = 1; i < tips.length; i++) {
    const a = tips[i - 1]!
    const b = tips[i]!
    const m = at(a, b, 0.5)
    const k = bulge / Math.hypot(m[0] - o[0], m[1] - o[1])
    d += ` Q${pt([m[0] + (m[0] - o[0]) * k, m[1] + (m[1] - o[1]) * k])} ${pt(b)}`
  }
  return d
}

const baseOf = (bases: readonly P[], i: number) => bases[Math.min(i, bases.length - 1)]!

/** Curved rays from each base, `from`..`reach` of the way to its tip, bowed `f` (or `f(i)`): fins that flow. */
function sweep(bases: readonly P[], tips: readonly P[], f: number | ((i: number) => number), from = 0, reach = 0.93): string {
  return tips
    .map((t, i) => {
      const s = at(baseOf(bases, i), t, from)
      return `M${pt(s)}${bow(s, at(baseOf(bases, i), t, reach), typeof f === 'number' ? f : f(i))}`
    })
    .join(' ')
}

/** Every other fold in shade: a wedge from `from` of the way out, opening onto the edge between two rays. */
function folds(bases: readonly P[], o: P, tips: readonly P[], f: number, bulge: number, from: number, odd = 1): string {
  const out: string[] = []
  for (let i = odd; i + 1 < tips.length; i += 2) {
    const a = tips[i]!
    const b = tips[i + 1]!
    const s = at(at(baseOf(bases, i), baseOf(bases, i + 1), 0.5), at(a, b, 0.5), from)
    out.push(`M${pt(s)}${bow(s, a, f)}${edge(o, [a, b], bulge)}${bow(b, s, -f)} Z`)
  }
  return out.join(' ')
}

/**
 * Traced from side photos of long-finned males (Commons C20 and C39 on a grid, the halfmoon plakat C04 under a
 * ghost of the drawing, iNat wild males): body about 2.8 long to deep, deepest behind the head and tapering to the
 * peduncle, the head a quarter of it, the lower jaw turned up past the upper lip, the eye high and near the snout.
 */
const BODY =
  'M157.6 41.8 C157.8 43.2 157.2 44.8 156.2 46.2 C154.2 49.2 150.6 52.2 146.4 54.6 C141.6 57.4 136 59.8 130 61.4 ' +
  'C122 63.2 112 64 104 63.6 C94 63.2 85 61 78 58.8 C75.4 58 73.4 57 71.6 55.8 C68.8 54.2 66.6 52.6 65.8 50.6 ' +
  'C66.6 48.6 68.8 47 71.6 45.4 C75 43.4 81 40 88 37 C96 33.8 105 31.2 114 30 C124 29 134 29.6 142 32.4 ' +
  'C147 34.2 151 37 153.4 39.4 C154.4 40.3 155.2 40.8 155.4 41.4 L154.8 42.4 C155.8 42.2 156.8 41.8 157.6 41.8 Z'

/** The body's top and bottom edges, sampled: the rows of scales stay inside them. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [72, 45.2, 55.6], [80, 41.4, 59.4], [88, 37, 61.6], [96, 33.9, 63], [104, 31.4, 63.6], [114, 30, 63.9], [124, 29.2, 63.2], [132, 29.5, 61], [138, 31, 59],
]
/** How far down the body (0 back, 1 belly) the point sits, or -1 outside a margin `m` from the edges. */
function depth(x: number, y: number, m: number): number {
  for (let i = 1; i < EDGE.length; i++) {
    const a = EDGE[i - 1]!
    const b = EDGE[i]!
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0])
      const top = a[1] + (b[1] - a[1]) * t
      const bottom = a[2] + (b[2] - a[2]) * t
      return y - m > top && y + m < bottom ? (y - top) / (bottom - top) : -1
    }
  }
  return -1
}
/**
 * One thin arc per scale, the visible rear edge of each, in staggered rows: a sheen strongest mid-flank, thinning
 * to every other scale and a fainter tone toward the face, the belly and the tail base, gone at the edges.
 */
const ARCS = Array.from({ length: 11 }, (_, row) => 32.4 + row * 3.1).flatMap((y, row) =>
  Array.from({ length: 18 }, (_, k) => ({ x: 74 + (row % 2) * 1.8 + k * 3.6, y, k }))
    .map((a) => ({ ...a, v: depth(a.x, a.y, 2.6) }))
    .filter((a) => a.x >= 82 && a.x <= 131 && a.v >= 0 && a.v <= 0.74),
)
const arc = (a: { x: number; y: number }) => `M${r1(a.x)} ${r1(a.y - 1.5)} a1.5 1.5 0 0 0 0 3`
const core = (a: { x: number; v: number }) => a.x >= 92 && a.x <= 124 && a.v >= 0.1 && a.v <= 0.6
const SCALES = ARCS.filter(core).map(arc).join(' ')
const SCALES_FAINT = ARCS.filter((a) => !core(a) && a.k % 2 === 0).map(arc).join(' ')

const PIVOT: P = [70, 50.6]
/** The veil: rays from the peduncle to its ruffled rear edge, from the upper lobe round to the drooping lower tip. */
const T_BASE: P[] = [[71, 45.6], [71, 46.6], [71, 47.6], [71, 48.6], [71, 49.6], [71, 50.6], [71, 51.6], [71, 52.6], [71, 53.6], [71, 54.6], [71, 55.6]]
const T_TIPS: P[] = [[40, 29], [30, 28.6], [21, 31], [13, 36.4], [7.4, 43.6], [4.6, 52], [4.8, 61], [7, 70], [10.8, 78.6], [16.2, 85.8], [23, 92.4]]
const TAIL = `M82 44 L77 42.4 C67 36 53 30.6 40 29${edge(PIVOT, T_TIPS, 1.6)} C31.4 90.6 40 86.4 47 81 C53 76 59 70.6 65.6 66 C70 64 74 61 80 57 L82 56 Z`

const D_BASE: P[] = [[103, 32.2], [99, 33.2], [95, 34.4], [91, 35.8], [87, 37.2], [83.4, 38.6], [80, 40], [76.8, 41.6], [74, 43.2]]
const D_TIPS: P[] = [[98, 12.6], [90, 8.8], [81, 7], [71.6, 7], [62.4, 8.4], [53.4, 10.8], [45, 14], [37.4, 17.6], [30.4, 21.2]]
const D_O: P = [86, 42]
const DORSAL = `M108 33 L104.4 31.8 C103.6 25 101.6 18.4 98 12.6${edge(D_O, D_TIPS, 1.4)} C42 24 54 30.4 62 35.4 C67 38.6 72 41 76.4 43 L80 45 Z`

const A_BASE: P[] = [[129, 61.8], [121, 63], [112, 63.6], [103, 63.4], [94, 62.8], [86, 61.2], [79, 59.6], [74, 58]]
const A_TIPS: P[] = [[123, 74.6], [113, 80], [102, 84.6], [91, 88.4], [80, 91.6], [69, 94.4], [58.4, 96.6], [46, 98.2]]
const A_O: P = [98, 56]
const ANAL = `M133.4 60.2 C132.4 66 129.4 71 123 74.6${edge(A_O, A_TIPS, 1.4)} C52 94 57 86 60.4 78 C63.6 71 67.6 63.4 74.6 58 L80 57.6 Z`

/**
 * Betta — the male Siamese fighting fish, a veiltail in royal blue with the red wash (the pet-shop "red-blue"):
 * deep blue body with big visible scales and a darker face, the bright blue dorsal and drooping veil tail streaked
 * red along the rays, the red anal fin, the long red pelvic fins with white tips, a small clear pectoral, the
 * upturned mouth. The long fins sweep back, fold like cloth and overlap: dorsal over the veil, pelvic over the anal.
 */
export const betta: FishArt = {
  body: BODY,
  tailPivot: PIVOT,
  tail: [
    part(TAIL, B.fin),
    { d: folds(T_BASE, PIVOT, T_TIPS, -0.1, 1.6, 0.3), fill: B.fold },
    stroke(sweep(T_BASE.slice(1), T_TIPS.slice(1), (i) => -0.11 + i * 0.01, 0.18, 0.9), B.finRay, 0.8),
    stroke(TAIL, B.line, 1.6),
  ],
  layers: [
    // dorsal: tall, swept back over the tail
    part(DORSAL, B.fin),
    { d: folds(D_BASE, D_O, D_TIPS, -0.08, 1.4, 0.3), fill: B.fold },
    stroke(sweep(D_BASE.slice(1, 8), D_TIPS.slice(1, 8), -0.08, 0.06), B.finRay, 0.8),
    stroke(DORSAL, B.line, 1.6),
    // far pelvic, the anal fin, then the near pelvic over it
    part('M137.6 58 C136 67 132.6 75.6 128.6 82 C126.6 85.4 124.4 88 121.8 90.6 C123.4 86.6 125.2 83 126.4 79 C129 72 131.4 65.6 133.6 59.4 Z', B.redRay, B.line, 1.2),
    part(ANAL, B.red),
    { d: folds(A_BASE, A_O, A_TIPS, 0.08, 1.4, 0.3, 0), fill: B.redFold },
    stroke(sweep(A_BASE.slice(1, 7), A_TIPS.slice(1, 7), 0.08, 0.06), B.redRay, 0.8),
    stroke(ANAL, B.line, 1.6),
    part('M139.4 57.2 C137 66 132 75 125.6 81.6 C122 85.4 118.2 88 114 90.4 C117 86.6 120.6 82.8 123.4 78.8 C128.4 72 132.6 65.8 135 59.2 Z', B.pelvic, B.line, 1.2),
    part('M119.6 87.2 C117.8 88.4 116 89.4 114 90.4 C115.4 88.8 116.8 87.2 118.2 85.4 Z', B.tip),
    part(BODY, B.body, B.line),
    // body: the big scales, the darker face in front of the gill cover
    { ...stroke(SCALES_FAINT, B.scaleFaint, 0.5), clip: true },
    { ...stroke(SCALES, B.scale, 0.5), clip: true },
    shade('M141.4 26 L141.4 32.6 C137.6 37.6 136.2 45 137.4 51.8 C138 54.8 139 56.8 140.4 58 L142 62 L160 62 L160 26 Z', B.head),
    stroke('M141.4 32.6 C137.6 37.6 136.2 45 137.4 51.8 C137.9 54.2 138.7 56 139.8 57.2', B.gill, 1.2),
    // pectoral: small, rounded, nearly clear
    part('M137.4 46.4 C134.4 44.2 130.6 44.2 129 46.4 C127.8 48.2 128.6 51 131.2 52.2 C133.4 53 135.6 52.4 136.8 51 Z', B.pec, B.line, 1),
    stroke(sweep([[137, 48.6]], [[130.6, 45], [129, 48.2], [130, 51.2], [132.8, 52.6]], 0.03, 0.15, 0.9), B.pecRay, 0.6),
    // mouth: the gape running back and down from the notch between the jaws; the iris ring
    stroke('M154.8 42.4 C154 42.9 153.2 43.4 152.4 43.9', B.line, 1),
    part('M143.6 41.4 A3.9 3.9 0 1 0 151.4 41.4 A3.9 3.9 0 1 0 143.6 41.4 Z', B.ring),
  ],
  eyes: [{ cx: 147.5, cy: 41.4, r: 3 }],
}
