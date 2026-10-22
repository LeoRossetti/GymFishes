import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const B = {
  silver: '#C3CED6',
  back: '#475B69',
  bar: '#5A6E7C',
  belly: '#EEF2F5',
  blotch: '#141B21',
  gill: '#33434E',
  fin: '#56656F',
  pec: '#7D8E9A',
  finRay: '#36434C',
  tail: '#4E5C66',
  edge: '#232C33',
  tip: '#E6ECF0',
  tooth: '#FAFCFD',
  ring: '#C9A24B',
  line: '#121A20',
}

/**
 * Traced from side photos (a live fish and a flat specimen): about 6:1 from snout to tail base (7.3:1 overall),
 * a straight tube of a body, the long pointed head a third of it, the eye high near the crown, the lower jaw
 * jutting past the upper, a narrow peduncle and a tail as tall as twice the body.
 */
const BODY =
  'M32 45.7 C40 44.2 50 42.2 60 40.9 C70 39.9 82 39.5 92 39.5 C102 39.5 111 39.7 118 40.5 C124 41.4 129.6 42.7 134.6 44.4 ' +
  'C140.2 46.3 146 47.9 150.2 49.6 C152.4 50.6 154.2 51.2 154.8 51.7 C155 52.1 154.4 52.5 153.6 52.6 C155.2 52.8 156.8 53.2 158 53.6 ' +
  'C158.9 54 158.8 55 157.8 55.4 C154.6 56.5 150.4 57.3 146 57.8 C140 58.6 132 59.3 124 59.8 C116 60.3 106 60.5 96 60.5 ' +
  'C84 60.5 72 59.9 62 59 C50 57.8 40 56 32 54.3 C29.4 52.8 29.4 47.2 32 45.7 Z'

/** The body's top and bottom edges, sampled: the bars hang from the back to just above the lateral line. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [32, 45.7, 54.3], [40, 44.1, 55.9], [50, 42.3, 57.6], [60, 40.9, 59], [75, 39.9, 60.1], [92, 39.5, 60.5],
  [105, 39.6, 60.5], [118, 40.5, 60],
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

/** Sixteen bars across the upper flank, as wide as the silver between them, leaning back at the top like the photos'. */
const BARS = Array.from({ length: 16 }, (_, i) => 109.6 - i * 4.65)
  .map((x) => {
    const [top, bottom] = edgeAt(x)
    const end = top + (bottom - top) * 0.42
    const lean = 4
    return `M${r1(x - lean)} ${r1(top - 2)} L${r1(x - lean + 2.6)} ${r1(top - 2)} L${r1(x + 2.3)} ${r1(end - 0.7)} C${r1(x + 2.1)} ${r1(end + 0.5)} ${r1(x + 0.2)} ${r1(end + 0.5)} ${r1(x)} ${r1(end - 0.5)} Z`
  })
  .join(' ')

/** A rounded, slightly lopsided blotch: wider on one side, taller on the other, like the photos' marks. */
function blob(cx: number, cy: number, rx: number, ry: number): string {
  const h = 0.55
  const R = [cx + rx, cy + ry * 0.15]
  const D = [cx - rx * 0.1, cy + ry]
  const L = [cx - rx * 0.9, cy - ry * 0.1]
  const U = [cx + rx * 0.15, cy - ry * 1.05]
  const p = (v: number[]) => `${r1(v[0]!)} ${r1(v[1]!)}`
  return (
    `M${p(R)} C${p([R[0]!, R[1]! + h * ry])} ${p([D[0]! + h * rx, D[1]!])} ${p(D)} ` +
    `C${p([D[0]! - h * rx, D[1]!])} ${p([L[0]!, L[1]! + h * ry])} ${p(L)} ` +
    `C${p([L[0]!, L[1]! - h * ry])} ${p([U[0]! - h * rx, U[1]!])} ${p(U)} ` +
    `C${p([U[0]! + h * rx, U[1]!])} ${p([R[0]!, R[1]! - h * ry])} ${p(R)} Z`
  )
}

/** The black blotches of the lower rear flank: scattered, irregular, the biggest under the second dorsal. */
const BLOTCHES = (
  [
    [95, 54.9, 0.9, 0.8], [74, 52.8, 1.1, 1.4], [70.2, 55, 0.7, 0.9], [63.4, 54.1, 1, 0.9], [54.2, 50.6, 1.5, 1.7],
    [50.4, 53.6, 0.7, 0.7], [44, 51.5, 1, 1.1], [37.4, 48.9, 0.8, 0.9],
  ] as const
)
  .map(([x, y, rx, ry]) => blob(x, y, rx, ry))
  .join(' ')

/**
 * Barracuda — the great barracuda of reefs and open water. A long silver body, a steel back with a row of
 * dark bars hanging from it, black blotches scattered on the lower rear flank; the long pointed head with the
 * big mouth, the lower jaw out front and fangs showing in the slit even with the mouth shut; two dorsal fins
 * far apart, the forked tail dark at the edge with pale tips.
 */
export const barracuda: FishArt = {
  body: BODY,
  tailPivot: [36, 50],
  tail: [
    part('M38.4 45.2 L33 45.1 C27 43.2 17.6 36.6 8.6 31.2 C6.8 30.4 5 30.6 5.4 32 C11.4 35.8 16.6 40.8 18.6 45.6 C19.4 47.8 18.8 49 18.8 50 C18.8 51 19.4 52.2 18.6 54.4 C16.6 59.2 11.4 64.2 5.4 68 C5 69.4 6.8 69.6 8.6 68.8 C17.6 63.4 27 56.8 33 54.9 L38.4 54.8 Z', B.tail, B.line),
    rays([37, 50], [[8.4, 32.2], [12.8, 37], [17, 44], [18.6, 50], [17, 56], [12.8, 63], [8.4, 67.8]], B.finRay, 0.88),
    part('M5.4 32 C11.4 35.8 16.6 40.8 18.6 45.6 C19.4 47.8 18.8 49 18.8 50 C18.8 51 19.4 52.2 18.6 54.4 C16.6 59.2 11.4 64.2 5.4 68 C11.6 64.8 18 60 20.4 54.8 C21.2 52.4 21 47.6 20.4 45.2 C18 40 11.6 35.2 5.4 32 Z', B.edge),
    part('M5.4 32 C7 32.9 8.6 33.9 10 35 C9.2 33.8 8.8 32.4 8.6 31.2 C6.8 30.4 5 30.6 5.4 32 Z M5.4 68 C7 67.1 8.6 66.1 10 65 C9.2 66.2 8.8 67.6 8.6 68.8 C6.8 69.6 5 69.4 5.4 68 Z', B.tip),
  ],
  layers: [
    // first dorsal (spiny, over the pelvic), second dorsal and anal (falcate, mirrored far back), pelvic
    part('M91.4 39.9 C89 36.6 86 33.4 82.8 31 C82 30.4 81.2 30.8 81.2 31.7 C81.2 34.5 80.8 37.1 79.6 40.1 Z', B.fin, B.line),
    stroke('M82.2 39.5 L82 31.5 M84.6 39.5 L83.8 32.5 M87 39.5 L85.8 34.1 M89.2 39.7 L87.8 36', B.finRay, 0.8),
    part('M60.4 41.2 C57.6 38.1 54.4 35.3 51.4 33.2 C50.6 32.6 49.8 33.2 50.2 33.9 C51.6 36.4 52.6 38.6 51.2 42.3 Z', B.fin, B.line),
    rays([57, 41.6], [[51, 33.8], [52.4, 35.6], [54.4, 36.9], [56.6, 38.8]], B.finRay, 0.85, 0.8),
    part('M56.8 58.6 C54.6 61.6 51.6 64.2 48.4 66.2 C47.6 66.7 46.9 66.2 47.3 65.5 C48.6 63.3 49.4 61 48.2 57.7 Z', B.fin, B.line),
    rays([54, 58.4], [[47.8, 65.7], [49.4, 63.6], [51.4, 61.9], [53.4, 60.3]], B.finRay, 0.85, 0.8),
    part('M95.4 60.3 C93 62.7 90 64.7 86.2 66.2 C85.4 66.5 85 65.9 85.6 65.3 C87.4 63.8 88.6 62.1 89.4 60.5 Z', B.fin, B.line, 1.2),
    part(BODY, B.silver, B.line),
    // body: the bars, the steel back over them and the head to the snout, the white belly and lower jaw, the blotches
    shade(BARS, B.bar),
    shade('M28 0 L160 0 L160 51.3 C156 51.3 152 50.9 148 49.8 C144 48.5 140 47 136 46.1 C130 44.6 124 43.5 118 43.1 C104 42.7 90 42.7 76 43.1 C60 43.7 44 45.3 28 47.6 Z', B.back),
    shade('M28 52.2 C40 53.4 50 53.9 60 54.1 C74 54.5 88 54.9 100 54.9 C108 54.9 114 55 120 55.6 C126 56.2 131 55.8 135.8 54.9 C141 54.1 148 53.2 153.6 52.6 L160 52.6 L160 92 L28 92 Z', B.belly),
    shade(BLOTCHES, B.blotch),
    // head: the gill-cover edge, the pectoral lying back from under it
    stroke('M118.2 41.6 C115.6 45.9 115.4 51.5 117.2 55.2 C118.6 57.7 120.4 58.8 122.8 59.1', B.gill, 1.2),
    part('M115.8 50.7 C111.2 51.3 104.4 53.2 99.4 55.4 C98.6 55.8 98.8 56.3 99.6 56.3 C104.8 56.2 111 55.2 115.6 54.1 C116.6 53.5 116.8 51.3 115.8 50.7 Z', B.pec, B.line, 1),
    rays([115.8, 52.4], [[100, 55.8], [102.4, 54.7], [106, 53.5]], B.fin, 0.9, 0.7),
    // mouth: the slit at the front with the fangs hanging in it, the gape back to under the eye
    part('M153.6 52.6 C152.2 54.9 147.4 55.6 143 53.7 C146.6 53.3 150.2 53 153.6 52.6 Z', B.line),
    part('M151.6 52.8 L152.7 52.7 L152 54.6 Z M149.3 53.1 L150.5 53 L149.8 55 Z M147 53.4 L148.1 53.3 L147.5 54.9 Z M144.9 53.6 L145.8 53.5 L145.3 54.6 Z', B.tooth),
    stroke('M153.6 52.6 C148 53.2 141 54.1 135.8 54.9', B.line, 1),
    // nostril, the pores along the lower jaw, the golden iris ring
    dots([[141.6, 48.7, 0.5]], B.line),
    dots([[150.4, 56.5, 0.32], [153, 56.1, 0.32]], B.gill),
    part('M131.3 48.9 A3.3 3.3 0 1 0 137.9 48.9 A3.3 3.3 0 1 0 131.3 48.9 Z', B.ring),
  ],
  eyes: [{ cx: 134.6, cy: 48.9, r: 2.6 }],
}
