import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const V = {
  back: '#1E3B78',
  flank: '#B4C3D6',
  belly: '#EEF2F7',
  sail: '#2450AC',
  sailRay: '#183D88',
  spot: '#0E2152',
  bar: '#8FC4F2',
  fin: '#264A8E',
  finRay: '#132A56',
  keel: '#16295A',
  gill: '#5B7395',
  ring: '#8FB3D9',
  line: '#0A1430',
}

/**
 * Traced from live side photos (and Lynch's plate for the fins): bill tip to tail fork about 7 times the
 * depth (deepened from the photos' 8–9 so it reads small), the bill a fifth of the length, round and
 * straight, the forehead rising from it to the nape, the back almost straight under the sail, a thin peduncle.
 * The lower jaw is a short pointed wedge under the bill's base, the notch cut where the jaws meet, the gape
 * running back to below the eye.
 */
const EDGE =
  'M24.6 47.72 C25.4 47.62 26.4 47.5 27.4 47.4 C34 46.2 44 44.6 54 43.2 C66 41.6 78 40.4 90 40.1 C100 39.9 110 40.3 119 41.6 ' +
  'C126 43.3 134 45.95 138.5 46.95 C145 47.7 152 48.25 158.6 48.7 C154 49.2 148 49.75 143.2 50.1 L141.5 50.45 L142.6 51 ' +
  'C141.4 51.4 139.6 52 137.6 52.8 C133 54.7 127 56.9 121 58.1 C114 59.3 104 59.7 92 59.2 C80 58.6 68 57 56 55 ' +
  'C46 53.4 36 51.8 27.4 50.8 C26.4 50.7 25.4 50.6 24.6 50.52'

/** The silhouette and clip: the outline closed by the round end of the tail stock, which carries no outline so the stock flows into the tail. */
const BODY = `${EDGE} C23.2 50.4 21.8 49.9 21.8 49.1 C21.8 48.3 23.2 47.85 24.6 47.72 Z`

/** The body's top and bottom edges, sampled from BODY: the sail's rays and the bars of dots sit on them. */
const SIDES: readonly (readonly [number, number, number])[] = [
  [24, 47.9, 50.5], [32, 46.6, 51.4], [40, 45.3, 52.5], [48, 44.1, 53.7], [60, 42.4, 55.7], [72, 41.2, 57.4],
  [84, 40.3, 58.7], [96, 40.1, 59.3], [108, 40.5, 59.3], [118, 41.5, 58.5],
]
function edgeAt(x: number): [number, number] {
  for (let i = 1; i < SIDES.length; i++) {
    const a = SIDES[i - 1]!
    const b = SIDES[i]!
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0])
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    }
  }
  const last = SIDES[SIDES.length - 1]!
  return [last[1], last[2]]
}
const r1 = (v: number) => Math.round(v * 10) / 10

/** The sail's ray tips, front to back: tall at the front, a little dip, the peak mid-sail, then falling to the back. */
const TIPS: readonly (readonly [number, number])[] = [
  [117.2, 12.6], [113.4, 14.2], [109.4, 14.6], [105.4, 13.8], [101.4, 12.6], [97.4, 11.6], [93.4, 11], [89.4, 11],
  [85.4, 11.8], [81.6, 13.4], [78, 15.8], [74.6, 18.8], [71.4, 22.4], [68.4, 26.4], [65.6, 30.6], [63, 34.8], [60.6, 38.6],
]
/** Where each ray leaves the back, closer together toward the rear, so the rays fan back like the photos'. */
const BASES = TIPS.map((_, i) => {
  const x = 118.4 - i * 3.62 * (1 - i * 0.012)
  return [x, edgeAt(x)[0]] as const
})

/** The sail: the straight front edge, then a scallop between every two ray tips, down the short back edge. */
const SAIL = (() => {
  let d = 'M119.6 43.4 L118.8 41.6 C118.4 32 117.8 22 117.2 12.6'
  for (let i = 1; i < TIPS.length; i++) {
    const [ax, ay] = TIPS[i - 1]!
    const [bx, by] = TIPS[i]!
    d += ` Q${r1((ax + bx) / 2 + 0.8)} ${r1((ay + by) / 2 + 4)} ${bx} ${by}`
  }
  return `${d} Q59.6 41 58 42.6 L57.6 44.2 Z`
})()

/** The rays, from the back to just short of their tips (the front edge is the first one). */
const SAIL_RAYS = BASES.slice(1)
  .map(([bx, by], k) => {
    const [tx, ty] = TIPS[k + 1]!
    return `M${r1(bx)} ${r1(by)} L${r1(bx + (tx - bx) * 0.93)} ${r1(by + (ty - by) * 0.93)}`
  })
  .join(' ')

/** Dark spots scattered between the rays, sizes and heights varied, thinning out toward the sail's base. */
const SPOTS = TIPS.slice(0, -2).flatMap(([tx, ty], i) => {
  const [bx, by] = BASES[i]!
  const [ux, uy] = TIPS[i + 1]!
  const [vx, vy] = BASES[i + 1]!
  return [0.3, 0.5, 0.7, 0.86]
    .filter((_, k) => (i * 5 + k * 3) % 4 !== 0)
    .map((f, k) => {
      const g = f + (((i * 7 + k * 5) % 5) - 2) * 0.035
      const x = (bx + vx) / 2 + ((tx + ux - bx - vx) / 2) * g
      const y = (by + vy) / 2 + ((ty + uy - by - vy) / 2) * g
      return [r1(x), r1(y), r1(0.55 + ((i * 3 + k * 7) % 4) * 0.12)] as const
    })
})

/** The edge of the dark blue: under the whole bill, up across the cheek to the eye, back along the upper flank, down over the tail stock. */
const DARK_EDGE =
  'L143.2 50.3 L141.5 50.45 C138.6 49.4 136 48.4 133.6 47.6 C131.6 47 129.6 46.6 127.6 46.5 C124 46.4 121 46.6 118 46.6 ' +
  'C110 46.6 104 46.8 98 46.9 C88 47 78 47 68 47.2 C58 47.5 50 47.8 44 48.2 C38 48.7 34 49.6 30.6 51.2 L18 54'

/** The pale blue bars of the flank: vertical rows of dots from the back to the middle of the side. */
const BARS = Array.from({ length: 17 }, (_, i) => 114 - i * 4.4).flatMap((x) => {
  const [top, bottom] = edgeAt(x)
  const step = (bottom - top) * 0.085
  return [0, 1, 2, 3, 4, 5].map((k) => [r1(x + k * 0.15), r1(top + 1.6 + k * step), 0.5] as const)
})

/**
 * Agulhão-bandeira (peixe-vela, sailfish) — the fastest fish in the sea. The huge blue sail, taller than the
 * body and spotted dark, raised from just behind the head; the round spear of a bill over a short pointed lower
 * jaw, the eye above the end of the gape, the gill cover's arc. Dark blue back over silver, pale blue bars of
 * dots down the side, a white belly; the long sickle pectoral, the two long pelvic fins hanging from the throat,
 * two little second fins and the keel on the tail stock, the deep crescent tail.
 */
export const sailfish: FishArt = {
  body: BODY,
  tailPivot: [24, 49.2],
  tail: [
    part('M31 47.2 L25 47.6 C21.4 44 18 39.2 14.8 34.2 C11.6 29 8 23.6 4.6 18.2 C9.6 24.6 14.6 32.4 17 40.4 C17.8 43.4 18.2 46.4 18.8 49.3 C18.2 52.4 17.6 55.4 16.8 58.6 C15.4 65 13.6 72.2 11.6 79.4 C15.8 72 19.8 64.8 22.6 58 C23.6 55.4 24.4 52.8 25 51 L31 51.2 Z', V.back, V.line),
    rays([24, 49.2], [[9.4, 24.6], [14.2, 33.6], [15.4, 63.4], [13.6, 72.6]], V.finRay, 0.85, 0.6),
  ],
  layers: [
    // the sail with its rays and spots; the little second dorsal and anal, the first anal, the two pelvic fins
    part(SAIL, V.sail, V.line, 1.3),
    stroke(SAIL_RAYS, V.sailRay, 0.55),
    dots(SPOTS, V.spot),
    part('M50 45.6 L49.4 44.2 C47.6 42.8 45.2 41.6 41.8 40.8 C43 42.2 43.8 43.6 44 45.6 Z', V.fin, V.line, 1.1),
    part('M49 52.4 L48 53.8 C46.4 55 44.4 56.2 41.6 57 C42.6 55.6 43.2 54.4 43.2 52.6 Z', V.fin, V.line, 1.1),
    part('M96.5 58.4 L95.6 59.6 C94 62 91.2 64.6 86.2 67 C87.4 65.4 87.6 63.2 86.6 61.4 C85.8 60.2 84.8 59.4 83.4 58.6 L83.8 57.2 Z', V.fin, V.line, 1.2),
    part('M120 57.4 C114 64.6 100.6 76.6 93.6 79.6 C100.4 73.6 110.6 64 116.4 58.2 Z', V.finRay, V.line, 1),
    part('M120 57.4 C115 66 106 78 99.4 86.4 C104.6 77 111.4 66 116.4 58.2 Z', V.fin, V.line, 1),
    part(BODY, V.back),
    stroke(EDGE, V.line, 1.6),
    // body: dark blue down to the eye (the whole bill and the tail stock), the silver flank, the white lower jaw and belly, the bars, the keel
    shade(`M162 100 L162 50.6 ${DARK_EDGE} L18 100 Z`, V.flank),
    shade('M143 50.8 L141.5 50.45 C137 51 132 51.6 128 52.3 C124 53 121 53.4 118 53.4 C110 53.6 104 53.5 98 53.4 C88 53.2 78 52.8 68 52.4 C58 52 50 51.6 44 51.7 C40 51.9 37 52.6 34.4 53.6 L30 56 L30 100 L143 100 Z', V.belly),
    shade(`M162 0 L162 50.6 ${DARK_EDGE} L18 0 Z`, V.back),
    dots(BARS, V.bar, true),
    shade('M36 49.1 C33.8 48.7 31.6 48.7 29.4 49.2 C31.6 49.6 33.8 49.6 36 49.1 Z', V.keel),
    // head: the long pectoral on the flank, its base under the gill-cover arc
    part('M116.4 52.4 C112.6 52.8 107.6 54 103 55.8 C100.8 56.7 98.8 57.6 97.4 58.4 C100.6 58.2 104.4 57.6 108 57 C111 56.5 114 56 116 55.4 C117.4 55 117.6 52.8 116.4 52.4 Z', V.fin, V.line, 1.1),
    rays([116, 54], [[100.4, 57.2], [99.2, 58.1]], V.finRay, 0.85, 0.5),
    stroke('M117.2 46.8 C115.2 49.4 114.8 53.6 116.8 57.6', V.gill, 1.1),
    // mouth: the cleft from the notch back to below the eye; the iris ring
    stroke('M141.5 50.45 C137 51 132 51.6 128 52.3', V.line, 0.8),
    part('M125.9 48 A2.7 2.7 0 1 0 131.3 48 A2.7 2.7 0 1 0 125.9 48 Z', V.ring),
  ],
  eyes: [{ cx: 128.6, cy: 48, r: 2.1 }],
}
