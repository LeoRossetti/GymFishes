import { part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const G = {
  blue: '#4372F0',
  tux: '#231F48',
  head: '#93A3BF',
  silver: '#DCE4F0',
  gill: '#56617C',
  red: '#E8401F',
  redLight: '#FA6436',
  redRay: '#C2301B',
  gono: '#7D86A6',
  pect: '#8A9FE2',
  pectRay: '#5D74C8',
  ring: '#2E3550',
  line: '#16182E',
}

/**
 * Traced from a right-facing delta male (Commons, C. E. Joos): snout to tail base about 4:1 against depth
 * (a touch deeper than the photo's 4.2), nearly parallel-sided with a deep peduncle, head a quarter of the
 * body with a flat top, a big eye high and close to the snout, the lower jaw reaching past the upper so the
 * small mouth opens up and forward. The outline is left open at the tail base so the body runs into the tail.
 */
const OUTLINE =
  'M68 41.2 C80 40 92 39 104 38.6 C116 38.3 126 38.8 136 39.7 C143 40.4 149 41.6 155.2 43.2 ' +
  'L154.2 44.3 L157.2 43.8 C157.8 44.6 157.4 46 156.2 47.2 C153 50.2 147 53.6 141 56 ' +
  'C133 59 122 61 110 61.4 C98 61.6 84 61 68 59.8'
const BODY = `${OUTLINE} C66 57 64.8 53.6 64.8 50.4 C64.8 47.2 66 44 68 41.2 Z`

/** Delta tail: leaves the peduncle along the body line, flares fast, rounded corners, a soft convex rear edge. */
const TAIL =
  'M80 42.2 C76 41.6 72 41.2 68 41.2 C65.6 41.4 63 39.6 59.6 36.6 C50 28.4 42 21.8 32 16.6 C24 12.4 16 11.4 10 11.2 ' +
  'C7.4 11 6 12.2 5.4 14.6 C3.8 25 3 37.6 3 50.4 C3 63.2 3.8 75.8 5.4 86.2 C6 88.6 7.4 89.8 10 89.6 ' +
  'C16 89.4 24 88.4 32 84.2 C42 79 50 72.4 59.6 64.2 C63 61.2 65.6 59.4 68 59.6 C72 59.6 76 59.2 80 58.6 Z'
/** The lighter orange near the tail base: the tail's own edges, closed by an arc around the peduncle. */
const TAIL_BASE =
  'M80 42.2 C76 41.6 72 41.2 68 41.2 C65.6 41.4 63 39.6 59.6 36.6 C50 28.4 42 21.8 32 16.6 ' +
  'C24.6 28 20.5 40 20.5 50.4 C20.5 60.8 24.6 72.8 32 84.2 ' +
  'C42 79 50 72.4 59.6 64.2 C63 61.2 65.6 59.4 68 59.6 C72 59.6 76 59.2 80 58.6 Z'
const DORSAL =
  'M112 39.4 C109 36.4 104 33.8 97 32 C86 29.2 72 27.4 58 26.6 C56 26.6 55.4 28 56.8 28.8 ' +
  'C63 31 69 33 75 35 C80.6 36.8 85.6 38.4 89.6 40.6 Z'

/** Piecewise-linear lookup along sampled [x, y] points, held flat past the ends. */
function along(points: readonly (readonly [number, number])[], x: number): number {
  const first = points[0]!
  if (x <= first[0]) return first[1]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    if (x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])
  }
  return points[points.length - 1]![1]
}
/** The black's upper edge and the belly line (silver's edge, then the outline), sampled from the shades above. */
const TUX_TOP = [[80, 40], [84, 43.4], [90, 46], [96, 48.4], [104, 49.3], [112, 49.6], [118, 49.9], [121.4, 52.5]] as const
const BELLY = [[66, 59.4], [84, 60.8], [92, 59.4], [102, 57.8], [118, 56], [134, 54.2]] as const
/** Each scale edge one small step off the area under it (faint, then full), fading out toward head, belly and tail base. */
const SCALE_TONES = { blue: ['#3F6BE8', '#3A63DC'], tux: ['#27244F', '#2C2B5E'] } as const
const clamp = (v: number) => Math.min(1, Math.max(0, v))
function scaleNet(): Layer[] {
  const paths: Record<string, string[]> = {}
  for (let row = 0; row < 7; row++) {
    const y = 41.4 + row * 2.8
    for (let x = 66 + (row % 2) * 1.5; x <= 134; x += 3) {
      const tuxAt = (u: number) => (u < 80 ? 0 : u > 121.4 ? 100 : along(TUX_TOP, u))
      const top = tuxAt(x)
      if (Math.min(Math.abs(y - top), Math.abs(y - tuxAt(x - 1.3))) < 1.6) continue
      const w = Math.min(clamp((131 - x) / 12), clamp((x - 68) / 12), clamp((along(BELLY, x) - y) / 6))
      if (w < 0.25) continue
      const color = SCALE_TONES[y > top ? 'tux' : 'blue'][w < 0.6 ? 0 : 1]
      ;(paths[color] ??= []).push(`M${x.toFixed(1)} ${(y - 1.3).toFixed(1)} a1.3 1.3 0 0 0 0 2.6`)
    }
  }
  return Object.entries(paths).map(([color, d]) => ({ ...stroke(d.join(' '), color, 0.5), clip: true }))
}

/**
 * Guppy — Poecilia reticulata, the aquarium male in the neon tuxedo (half-black) strain with a red delta
 * tail: grey head, neon-blue front and back, the black "tuxedo" over the rear half, the net of scale edges
 * the species is named for, silver throat and belly; the tail orange at the base and deeper red at the rim,
 * the long low dorsal streaming back toward it, the slender gonopodium under the belly.
 */
export const guppy: FishArt = {
  body: BODY,
  tailPivot: [68, 50.4],
  tail: [
    part(TAIL, G.red),
    part(TAIL_BASE, G.redLight),
    rays([72, 50.4], [[10.4, 12.6], [6.4, 17], [4.8, 23], [3.8, 30], [3.3, 37], [3.1, 43.6], [3, 50.4], [3.1, 57.2], [3.3, 64], [3.8, 71], [4.8, 78], [6.4, 84], [10.4, 88.2]], G.redRay, 0.9, 0.6),
    stroke(TAIL, G.line, 1.6),
  ],
  layers: [
    part(DORSAL, G.redLight, G.line),
    rays([109, 39.6], [[98, 32.4], [88, 29.8], [76, 28], [64, 27], [60, 28.4], [68, 31.6], [78, 35]], G.redRay, 0.9, 0.7),
    part('M122 59.6 C114 61.6 105 63.8 97 65.2 C96.2 65.4 96.2 66.2 97 66.2 C105 65.8 111.6 64 116 60.8 Z', G.gono, G.line, 1),
    part(BODY, G.blue),
    // body: the black tuxedo over the rear lower flank, the grey head, the silver throat and belly
    shade('M56 30 L76 30 C78 36 82 42 90 46 C96 48.6 104 49.4 112 49.6 C118 49.8 121.4 52 121.4 56 L121.4 66 L56 66 Z', G.tux),
    ...scaleNet(),
    shade('M137 30 C135.8 36 135.4 40 134.6 42 C131.4 46 131 52 133.4 57.4 C134 59 134.4 60.4 134.6 62 L160 62 L160 30 Z', G.head),
    shade('M160 45.6 C154 48.6 148 51.2 141 52.8 C134 54.2 126 55.2 118 56 C110 56.8 102 57.8 96 58.8 C92 59.4 88 60.6 84 62.4 L84 70 L160 70 Z', G.silver),
    stroke(OUTLINE, G.line, 1.6),
    // head: the gill-cover edge, the pectoral, the mouth cleft from the notch, the iris ring
    stroke('M134.6 42 C131.4 46 131 52 133.4 57.4', G.gill, 1.2),
    part('M132.2 50.8 C129 48.8 124.8 48.2 122 49.4 C120.6 50.6 120.8 52.8 122.4 54 C125.2 55.8 129.4 55.2 132.2 53.2 C132.8 52.4 132.8 51.6 132.2 50.8 Z', G.pect, G.line, 0.8),
    rays([132, 52], [[123, 49.8], [121.8, 51.8], [123.2, 54.2]], G.pectRay, 0.85, 0.6),
    stroke('M154.2 44.3 C153.8 44.7 153.3 45 152.8 45.2', G.line, 1),
    part('M142.3 46.6 A4.1 4.1 0 1 0 150.5 46.6 A4.1 4.1 0 1 0 142.3 46.6 Z', G.ring),
  ],
  eyes: [{ cx: 146.4, cy: 46.6, r: 3.3 }],
}
