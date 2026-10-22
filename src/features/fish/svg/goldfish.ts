import { dots, OUTLINE, part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const K = {
  orange: '#FF8A1C',
  back: '#EE6216',
  belly: '#FFCB6E',
  scale: '#EA741A',
  scaleFaint: '#F5811C',
  plate: '#C9500E',
  fin: '#FFA040',
  finTip: '#FFD8A2',
  farFin: '#EE9443',
  finRay: '#D8641C',
  pec: '#FFB457',
  ring: '#F6CB5A',
  line: '#4A1D07',
}

/**
 * Traced from side photos of fantails (and the head close-ups): an egg about 1.45:1, the back climbing in one
 * convex curve to the dorsal origin, a short deep peduncle, a short head with a blunt rounded snout and the small
 * mouth at its tip (the upper lip a rounded pucker over the lower), a round deep belly.
 */
const BODY =
  'M72 40 C80 32.6 92 24.6 104 21.4 C110 20 116 19.8 121 20.8 C131 22.8 141 28.6 148 35.8 ' +
  'C153.2 41.2 156.4 43.6 157.4 47.6 C157.9 49.6 157.7 51.2 156.4 51.9 L155.6 52.3 C157 52.9 157.7 54.1 157.4 55.6 ' +
  'C156.8 58.4 154.4 61.6 150.2 64.8 C141 71.4 129 76.6 116 78.4 C104 79.6 93 77 85 71.8 C80 68.4 76 64.4 72 61 ' +
  'C70.6 54 70.6 47 72 40 Z'

/** The body's top and bottom edges, sampled: the scale rows follow them and shrink toward the peduncle. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [72, 40, 61], [80, 33.4, 67.6], [90, 27, 73.6], [100, 22.6, 77.6], [110, 20.6, 79], [120, 20.6, 78.4], [130, 23.6, 75.6],
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

const r2 = (v: number) => Math.round(v * 100) / 100
const ROWS = 8
/**
 * Big scales as thin arcs open toward the head, in rows that follow the body, only a step darker than the flank.
 * They sit in an oval on the mid-flank and fade (lighter, then none) toward the back, belly, gill cover and tail stock.
 */
function scales(): Layer[] {
  const strong: string[] = []
  const faint: string[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let x = 82 + (row % 2) * 2.8; x <= 126; ) {
      const [top, bottom] = edgeAt(x)
      const step = (bottom - top) / ROWS
      const y = top + step * (row + 0.5)
      const w = 1 - ((x - 104) / 21) ** 2 - ((y - 47) / 14) ** 2
      const r = step * 0.55
      const arc = `M${r2(x)} ${r2(y - r)} a${r2(r * 0.72)} ${r2(r)} 0 0 0 0 ${r2(r * 2)}`
      if (w > 0.4) strong.push(arc)
      else if (w > 0) faint.push(arc)
      x += step * 1.1
    }
  }
  return [
    { d: strong.join(' '), fill: 'none', stroke: K.scale, strokeWidth: 0.6, clip: true },
    { d: faint.join(' '), fill: 'none', stroke: K.scaleFaint, strokeWidth: 0.6, clip: true },
  ]
}

/** One half of the double tail: two broad lobes and a deep fork. The far half is the same fin turned 8° down. */
const NEAR_TAIL =
  'M80 41.6 C72 36.4 62 29 50 22.6 C40 17.4 26 12.6 12 11.6 C6 11.2 3.6 13.4 5.6 16.4 C10 23 17 28.6 24 33.2 ' +
  'C30 37.2 34.4 41.4 37.6 46.4 C38.6 47.8 38.6 49.4 37.6 50.6 C33 56.4 27 62.6 21 68.6 C16.4 74 12.6 80 11.6 84.6 ' +
  'C11 87.6 13 89 15.6 88 C28 83 42 75 54 68.4 C64 63 72 60.4 80 59.4 Z'
const FAR_TAIL =
  'M81.8 41.7 C73.2 37.6 62.3 31.7 49.5 27 C38.9 23.3 24.3 20.5 10.3 21.4 C4.3 21.9 2.2 24.4 4.6 27.1 C9.9 33 17.6 37.6 25.2 41.2 ' +
  'C31.7 44.3 36.6 47.8 40.5 52.3 C41.7 53.6 41.9 55.2 41.1 56.5 C37.3 62.9 32.3 69.9 27.2 76.6 C23.4 82.6 20.4 89.1 20.1 93.8 ' +
  'C19.9 96.8 22.1 97.9 24.5 96.6 C36.1 89.9 48.8 80 59.8 71.8 C69 65.1 76.5 61.4 84.3 59.3 Z'
/** The near half without its pale, see-through lobe tips (split off the same curves). */
const NEAR_BASE =
  'M80 41.6 C72 36.4 62 29 50 22.6 C45.5 20.3 40.2 18 34.4 16.1 C30.4 20.2 14.8 25.5 18.8 29.6 C20.5 30.8 22.2 32.1 24 33.2 ' +
  'C30 37.2 34.4 41.4 37.6 46.4 C38.6 47.8 38.6 49.4 37.6 50.6 C34.1 55 29.9 59.5 25.5 64.1 C21.5 69.4 25.1 76.5 29.1 81.8 ' +
  'C37.6 77.6 46.2 72.7 54 68.4 C64 63 72 60.4 80 59.4 Z'

/**
 * Kinguio — the aquarium goldfish, fantail form. Orange with a deeper back and a gold-cream belly and throat, big
 * scales in rows, a tall dorsal, long pelvic fins, the double anal fin and the double forked tail: the far half shows
 * through the near half's fork and below it. Small terminal mouth, no barbels, nostril ahead of the gold-ringed eye.
 */
export const goldfish: FishArt = {
  body: BODY,
  tailPivot: [74, 50],
  tail: [
    part(FAR_TAIL, K.farFin, K.line),
    part(NEAR_TAIL, K.finTip),
    part(NEAR_BASE, K.fin),
    rays([80, 50], [[8, 13.4], [16, 22.6], [27, 34], [25, 65], [16.6, 77], [13.4, 86.4]], K.finRay, 0.9, 0.8),
    stroke(NEAR_TAIL, K.line, OUTLINE),
  ],
  layers: [
    // dorsal (tall, front rays longest), the double anal fin, the long pelvic fin
    part('M118.4 25.4 C114.6 17.4 110 9.6 104.4 4 C102.6 2.2 100 1.8 97.8 2.8 C91.4 5.8 85.4 11.6 81.2 18.4 C79.8 20.6 79 22.8 78.6 25 C78.2 28.4 78.2 31.6 78.4 35 Z', K.fin, K.line),
    stroke('M113.6 25.6 L103 5 M108 26.4 L96.8 5.8 M102 27.4 L90.6 9.2 M96 29 L85.6 14 M90 31 L82.2 19.6', K.finRay, 0.8),
    part('M86.4 70.8 C83.4 76.4 78.4 82 71.4 86.4 C69.4 87.6 67.4 87.2 67 85.4 C66.6 83.4 67.4 80.4 68.4 77.4 C69.8 73 72.4 68.4 76.4 63.6 Z', K.farFin, K.line, 1.2),
    part('M90.6 73.4 C87.6 79 82.6 84.6 75.6 89 C73.6 90.2 71.6 89.8 71.2 88 C70.8 86 71.6 83 72.6 80 C74 75.6 76.4 71.4 79.6 67 Z', K.fin, K.line),
    part('M113.6 76.6 C110.6 83 105.6 89.4 98.6 94.2 C96.6 95.6 94.4 95.2 94 93.4 C93.6 91.4 94.6 88.2 95.8 85 C97.2 81.6 99 78.6 101 76.6 Z', K.fin, K.line),
    stroke('M108 79 L97.6 92.6 M103.6 79 L95.6 91.2 M86.4 74.8 L74.6 87.4 M82.4 72 L73 85.4', K.finRay, 0.7),
    part(BODY, K.orange, K.line),
    // body: the deeper back and crown, the gold belly running forward into the throat, the scale rows
    shade('M60 0 L160 0 L160 44 C156 40.6 151 37.4 145.6 35 C138 30.6 128 28.4 118 28 C104 27.8 90 31.4 78 38 C72 41 66 43.6 60 45.6 Z', K.back),
    shade('M60 61 C72 66.6 86 71 100 72 C114 72.6 128 69.6 140 64 C146 61.2 152 58 160 54 L160 100 L60 100 Z', K.belly),
    ...scales(),
    // head: the gill-cover edge, the softer preopercle groove under the eye, pectoral fin
    stroke('M140.4 41 C137.6 47 138.2 55 143 61', K.plate, 0.7),
    stroke('M131.4 26.4 C125 37.4 124.6 56 131.2 68', K.plate, 1.3),
    part('M133.6 61.4 C129 61 123.6 62.6 120.2 65.6 C118.2 67.4 118.4 70.6 120.6 72 C122.6 73.2 125.4 72.6 127.4 70.8 C129.8 68.6 132 66.2 133.6 64.4 C134.4 63.4 134.4 62 133.6 61.4 Z', K.pec, K.line, 1.1),
    stroke('M132.6 61.8 L120.6 67.6 M132.8 62.6 L122.4 71 M133 63.2 L126 72', K.finRay, 0.6),
    // mouth: the short cleft back from the notch; nostril; the gold iris ring
    stroke('M155.6 52.3 C154.6 52.6 153.6 52.8 152.6 52.9', K.line, 1.1),
    dots([[153, 43.6, 0.85]], K.line),
    part('M143.1 47 A4.3 4.3 0 1 0 151.7 47 A4.3 4.3 0 1 0 143.1 47 Z', K.ring),
  ],
  eyes: [{ cx: 147.4, cy: 47, r: 3.4 }],
}
