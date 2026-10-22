import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const D = {
  gold: '#EDB234',
  back: '#BA8C2A',
  head: '#E99F32',
  belly: '#F8E6A6',
  tooth: '#FFF4D6',
  dot: '#5A3B12',
  plate: '#B4741C',
  fin: '#F09A2E',
  finRay: '#B5561A',
  tail: '#E2582A',
  band: '#2F1F0E',
  ring: '#F4D15A',
  line: '#2C1B0A',
}

/**
 * Traced from side photos (and Natterer's plate): about 3.3:1, the back rising to a hump behind the head,
 * a big head (a third of the body) with a straight forehead, the lower jaw hooking out past the snout.
 */
const BODY =
  'M35 44.6 C44 41 56 36.6 70 32.6 C80 29.8 88 28.4 96 28.2 C108 28 120 29.6 130 32.4 C138 34.8 146 39.6 152.6 44.6 ' +
  'C154.6 46 155.8 47.2 156 48.2 L155 49.4 C156.6 49.6 157.8 50.2 157.9 51.2 C157.9 52.6 156 54 152.8 55.4 ' +
  'C146 58.4 136 61.6 126 63.2 C112 65.4 98 66 86 65.4 C72 64.6 58 62 48 59.4 C42 58 38 57.2 35 56.6 C33 53.4 33 47.8 35 44.6 Z'

/** The body's top and bottom edges, sampled: the rows of dots follow them. */
const EDGE: readonly (readonly [number, number, number])[] = [
  [36, 44.4, 56.8], [48, 40, 59.4], [70, 32.6, 64], [96, 28.2, 65.8], [116, 29.2, 64],
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

/** One dark dot per scale, in rows along the body from the back to the lower flank (the photos' dotted stripes). */
const DOTS: [number, number, number][] = Array.from({ length: 11 }, (_, row) => 0.1 + row * 0.064).flatMap((f, row) => {
  const out: [number, number, number][] = []
  for (let x = 37 + (row % 2) * 1.3; x <= 116; x += 2.6) {
    const [top, bottom] = edgeAt(x)
    out.push([Math.round(x * 10) / 10, Math.round((top + (bottom - top) * f) * 10) / 10, 0.42])
  }
  return out
})

/**
 * Dourado — the golden river fish of the Paraná and the Pantanal. Gold with an olive back, a dark dot on
 * every scale making rows along the body, orange fins, a red-orange tail with a black stripe through the
 * middle; the big head with the long gape and the lower jaw out front, the small eye high up.
 */
export const dourado: FishArt = {
  body: BODY,
  tailPivot: [37, 50.8],
  tail: [
    part('M39.6 44 C30 38.8 17 32 4 26.4 C7.4 34.6 12.6 43 18.4 50.6 C12.6 58.4 7.6 66.4 5.6 74 C17.6 68 30 62.4 39.6 57.4 Z', D.tail, D.line),
    part('M39 45.6 C32 42 26 39.4 20 37.4 C22 42 24.8 46.6 27.6 50.6 C24.8 54.6 22 59 20 63.6 C26 61 32 58.4 39 55.8 Z', D.fin),
    rays([39, 50.8], [[6.6, 29], [11.6, 36], [16.6, 44], [16, 57.6], [11, 65.6], [7.6, 71.6]], D.finRay, 0.85),
    part('M39.6 48.8 C34 49.4 28.6 50 23.6 50.8 C28.6 51.6 34 52.2 39.6 52.8 Z', D.band),
  ],
  layers: [
    // dorsal (tall, leaning back), adipose, the anal fin with its long front rays, pelvic
    part('M93 28.6 C88.6 24.6 82.6 20 76.6 16.4 C75 15.6 74 16.4 74.2 18 C74.6 22.6 73.6 27.4 71.4 31.6 Z', D.fin, D.line),
    rays([77, 31], [[75.2, 17.6], [78.4, 19], [82, 21.6], [86, 24.6], [89.6, 27.4]], D.finRay, 0.88),
    part('M47 41 C45.4 37.6 41.2 36.8 38.6 38.8 C38 40.4 38.6 42.2 40 43.4 Z', D.fin, D.line, 1.2),
    part('M72.4 64.4 C69.4 68.6 64.8 72.2 59.4 74.2 C58 74.6 57.2 73.6 57.8 72.4 C55.6 68.6 51.6 63.6 46.4 59.4 Z', D.fin, D.line),
    rays([66, 63.4], [[59.4, 73.4], [56.6, 70.4], [53, 66.4], [49.4, 62.4]], D.finRay, 0.85),
    part('M91 65.6 C87.6 68.6 83.6 71.4 79.2 73 C78 73.4 77.6 72.4 78.2 71.6 C80.6 69.6 82.2 67.4 83 65.2 Z', D.fin, D.line, 1.2),
    part(BODY, D.gold, D.line),
    // body: pale belly, the warmer head, the olive back, the rows of dots, the stripe on the peduncle
    shade('M30 58.6 C50 61.4 72 63.4 96 63.6 C112 63.6 126 61.4 138 58.4 C146 56.4 152 54.2 160 51 L160 92 L30 92 Z', D.belly),
    shade('M124.6 28 C117.6 40 117 54 122.4 66 L160 66 L160 28 Z', D.head),
    shade('M30 0 L160 0 L160 33 C150 35.4 140 35.6 128 35.4 C108 35.6 86 37.2 64 40 C50 41.8 40 44 30 47 Z', D.back),
    dots(DOTS, D.dot, true),
    shade('M33 50.2 L46 50.6 L46 51.4 L33 51.8 Z', D.band),
    // head: the gill-cover edge and the preopercle, the pale lower jaw, the gape, nostril, iris ring
    stroke('M134 36 C128.6 43 128.4 53 132.6 60.4', D.plate, 0.9),
    part('M122.6 56.6 C116 58.6 109 62.4 103.4 66.4 C109.8 67 116.6 64.4 123 60.6 C124.2 59 124 57.2 122.6 56.6 Z', D.fin, D.line, 1),
    stroke('M124.6 31.4 C117.6 40 117 54 122.4 63.8', D.plate, 1.3),
    part('M153.2 49.9 L152 52.4 L151 50.2 Z M149.6 50.8 L148.4 53.3 L147.4 51.1 Z M146 51.8 L144.9 54.2 L143.9 52.2 Z', D.tooth),
    stroke('M155 49.4 C150.4 50.4 145.6 51.8 140.6 53.6', D.line, 1.2),
    dots([[151, 43.6, 0.7]], D.line),
    part('M141.2 44.8 A3.8 3.8 0 1 0 148.8 44.8 A3.8 3.8 0 1 0 141.2 44.8 Z', D.ring),
  ],
  eyes: [{ cx: 145, cy: 44.8, r: 3 }],
}
