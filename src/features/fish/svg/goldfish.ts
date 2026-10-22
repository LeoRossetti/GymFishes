import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const K = {
  body: '#FA5C20',
  back: '#E2421C',
  glint: '#FF8E3E',
  belly: '#FFDAC0',
  plate: '#C93512',
  fin: '#F95E28',
  tip: '#FFC6B0',
  farMid: '#E4502A',
  farTip: '#F2A68E',
  finRay: '#D2431C',
  ring: '#F2BE4A',
  line: '#4C1207',
}

/**
 * Traced from side photos of ryukins (the red one at Yatomi first, with head close-ups of others): snout to tail
 * base about 1.35 times the depth, the back climbing steeply from the small pointed head to the shoulder hump at
 * the dorsal's origin, then falling to a short, deep tail stock; a round, deep belly lowest under the pelvic fins.
 * The mouth is small and at the tip: the upper lip a rounded pucker over the lower, the notch where they meet.
 */
const EDGE =
  'M80.6 26.4 C84 23.6 88 20.8 93 18.6 C99 16.2 105 15.4 111 15.4 C117 15.5 122 17 126.6 19.8 C131.4 22.2 136 25.6 140.2 29.8 ' +
  'C144.6 34.2 149.6 39.8 152.8 43.6 C154.6 45.4 156.6 47 157.2 48.6 C157.6 50 157.2 51 156.4 51.4 L155.2 51.7 ' +
  'C156 52.2 156.3 53.2 155.9 54.2 C155.2 55.6 153.8 56.6 152 57.4 C146.6 60.4 141 63.6 134.4 66.6 C127 70 118 73.4 108 74.2 ' +
  'C100 74.8 93 73.6 87.6 70.4 C84.4 68 82.2 64.6 80.8 61.2'

/** The silhouette and clip: the outline closed by the round end of the tail stock, which carries no outline so the stock flows into the tail. */
const BODY = `${EDGE} C79.2 57 78.6 52 78.6 44 C78.6 36 79.2 30 80.6 26.4 Z`

const r2 = (v: number) => Math.round(v * 100) / 100

/** Big scales as short glints on the free edge of each one, in rows across the upper flank where the light falls, fading out. */
function scales(): Layer {
  const arcs: string[] = []
  for (let row = 0; row < 6; row++) {
    const y = 29.6 + row * 4.4
    for (let x = 88 + (row % 2) * 2.3; x <= 130; x += 4.6) {
      const w = 1 - ((x - 110) / 22) ** 2 - ((y - 39) / 14) ** 2
      const r = 2 * Math.min(1, w + 0.45)
      if (w > 0.1) arcs.push(`M${r2(x - r * 0.4)} ${r2(y - r * 0.87)} A${r2(r * 0.8)} ${r2(r)} 0 0 0 ${r2(x - r * 0.4)} ${r2(y + r * 0.87)}`)
    }
  }
  return { d: arcs.join(' '), fill: 'none', stroke: K.glint, strokeWidth: 0.6, clip: true }
}

/**
 * The double tail: body red at the base, fading to pale see-through lobe ends; a long, narrow upper lobe, a rounded
 * fork, the broad lower lobe hanging down and back. The far half lies behind the near one, its lower lobe drooping
 * further (the same lobe turned 9° down), so its end shows under the near lobe.
 */
const NEAR_TAIL =
  'M86 27.4 L80.6 26.4 C72 23.4 62 20.8 50 19.2 C38 17.6 24 16.8 13 17.2 C8 17.4 4.8 18.6 4.6 20.4 C4.4 22 6.6 23.4 10.4 24.6 ' +
  'C18 27 28 29.6 38 31.8 C42.6 32.8 47.4 34 50.2 36.2 C48.6 41.6 45.6 47.6 41.6 53.4 C35.6 61.8 28 70 20.6 76.6 ' +
  'C17.6 79.2 15.4 81 15.4 82.2 C15.4 83.4 17.6 83.6 20.8 82.6 C30 79.8 42 75.6 54 70.6 C64 66.6 72.6 63 80.8 61.2 L86 60.6 Z'
const NEAR_BASE =
  'M86 27.4 L80.6 26.4 C72 23.4 62 20.8 52 19.4 C48 21.4 41 21.6 40 24.6 C39.2 27.4 42 31.2 46 33.4 C47.6 34.2 49 35 50.2 36.2 ' +
  'C49.6 38.4 49 40.6 48.2 42.8 C46 47 44.6 50.4 44.2 52.8 C43.8 55.4 46 56.6 48.4 55.8 C44 59.6 40.6 62.4 40 64.6 ' +
  'C39.4 67 42.6 68 45.4 67 C41 70.6 37.4 71.4 37.6 73 C37.8 74.6 41 75.4 46.4 74 C49 72.6 51.4 71.6 54 70.6 ' +
  'C64 66.6 72.6 63 80.8 61.2 L86 60.6 Z'
const FAR_LOBE =
  'M88.7 35.7 L53.4 41.3 C52.6 46.9 50.6 53.2 47.6 59.6 C43 68.8 36.7 78.1 30.5 85.8 C27.9 88.8 26 91 26.2 92.1 C26.4 93.3 28.6 93.2 31.6 91.7 ' +
  'C40.2 87.5 51.4 81.5 62.5 74.7 C71.8 69.1 79.7 64.2 87.5 61.2 L92.5 59.8 Z'
const FAR_BASE =
  'M88.7 35.7 L53.4 41.3 C52.6 46.9 51.4 51.6 49.6 55.4 C48 59.4 45.4 63.6 46.6 66 C47.6 67.8 50 67.8 51.8 67.2 C48.6 70.4 44.4 73.6 45.2 76.2 ' +
  'C46 78.4 49.6 79.4 53 80.4 C56.4 78.6 59.4 76.6 62.5 74.7 C71.8 69.1 79.7 64.2 87.5 61.2 L92.5 59.8 Z'

/** The tail's rays, fanning from the base: they start a little way out, so the tail stock stays clean. */
const TAIL_RAYS = (
  [[8, 19.6], [15, 22.6], [25, 26.2], [36, 29.8], [45.6, 41], [40.6, 55], [32.4, 65.4], [24, 74.2], [18.6, 80.4], [30, 79.2]] as const
)
  .map(([x, y]) => `M${r2(82 + (x - 82) * 0.2)} ${r2(44 + (y - 44) * 0.2)} L${r2(82 + (x - 82) * 0.88)} ${r2(44 + (y - 44) * 0.88)}`)
  .join(' ')

/**
 * Kinguio — the fancy goldfish as Brazilian pet shops sell it, the ryukin form: red-orange with the glint of big
 * scales on the flank, a cream throat and belly, the shoulder hump behind the small pointed head, a tall dorsal
 * leaning back, the long double tail, long pelvic fins, the double anal fin (its front showing under the tail
 * stock), a fan of a pectoral. Small mouth at the tip, no barbels, the nostril ahead of the big gold-ringed eye.
 */
export const goldfish: FishArt = {
  body: BODY,
  tailPivot: [80, 44],
  tail: [
    part(FAR_LOBE, K.farTip, K.line),
    part(FAR_BASE, K.farMid),
    part('M92 63.4 C88.6 68.6 84.4 73.6 79.4 77.6 C78 78.6 76.8 78 77 76.6 C77.8 72.8 80 68.4 83.6 63.8 Z', K.farMid, K.line, 1.2),
    part(NEAR_TAIL, K.tip),
    part(NEAR_BASE, K.body),
    stroke(TAIL_RAYS, K.finRay, 0.6),
    stroke(NEAR_TAIL, K.line, 1.6),
  ],
  layers: [
    // dorsal (tall, leaning back over the tail stock), the two long pelvic fins
    part('M116 19.6 L114.4 16.2 C112 10.4 106.6 5.6 99.6 3.4 C92 2.4 82 3.6 73.4 8.8 C76.6 13.6 80 19.4 83.4 24.2 L86 26 Z', K.fin, K.line),
    stroke('M112.6 16.8 L100.6 4.6 M108 16.4 L93.6 3.6 M103 16.8 L87.4 3.8 M98 17.6 L81.6 5.2 M93 19 L77 7.4 M88.6 21 L75 10', K.finRay, 0.6),
    part('M104 73.4 C102.6 79.8 98.4 87 91.8 92.4 C90.4 93.4 89 92.8 89.2 91.2 C89.4 85.6 90.2 79.6 92.4 74 Z', K.farMid, K.line, 1.2),
    part('M109.6 72.8 C108 79.6 103.4 87.6 96 93.6 C94.6 94.6 93.2 94 93.4 92.4 C93.4 86.6 94.2 80.2 96.6 74 Z', K.fin, K.line),
    rays([104.4, 74], [[95, 92.4], [98.6, 88.6], [102.6, 84]], K.finRay, 0.88, 0.6),
    part(BODY, K.body),
    stroke(EDGE, K.line, 1.6),
    // body: the deeper red back, the scale glints on the flank, the cream throat and belly
    shade('M86.4 22.2 C92 23.4 97 22.2 103 21.4 C111 20.6 118 21.4 125 23.8 C128.4 25 131 26.2 133.6 24.6 L133.6 0 L86.4 0 Z', K.back),
    scales(),
    shade('M157 53.6 C153 54.4 148.6 55.2 144.6 56.2 C140 57.4 134 60 128 62.6 C121 65.4 113 67.4 104 67.6 C97 67.6 92 68 88.4 69.4 C87.4 69.8 86.6 70.4 86 71.2 L86 100 L160 100 L160 53.6 Z', K.belly),
    // head: the gill-cover arc, the fan of the pectoral just behind it
    stroke('M134.4 27.6 C128.6 36.2 128 47.2 132.2 56.4', K.plate, 1.2),
    part('M135.6 51.2 C131 48.2 125 47 120.4 48.4 C118.2 49.2 117.4 52 118 54.6 C118.8 58 121 60.8 124 61.6 C127.4 62.4 131.4 59 134.4 55.8 C135.8 54.4 136.4 52 135.6 51.2 Z', K.fin, K.line, 1),
    rays([135, 53], [[120.8, 49.2], [118.8, 53.2], [120, 57.6], [123.4, 60.6]], K.finRay, 0.86, 0.55),
    // mouth: the short cleft back from the notch; nostril; the gold iris ring
    stroke('M155.2 51.7 C154.4 52 153.6 52.3 152.8 52.5', K.line, 1),
    dots([[151.4, 44.4, 0.85]], K.line),
    part('M140.4 48.4 A4.6 4.6 0 1 0 149.6 48.4 A4.6 4.6 0 1 0 140.4 48.4 Z', K.ring),
  ],
  eyes: [{ cx: 145, cy: 48.4, r: 3.6 }],
}
