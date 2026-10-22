import { part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const K = {
  white: '#FAF5F2',
  belly: '#F2E9E5',
  red: '#F2481E',
  plate: '#B8310F',
  socket: '#FF7448',
  fin: '#FAF5F2',
  farFin: '#ECD7D0',
  glow: '#FF9C7A',
  finRay: '#E35A3C',
  ring: '#F2BE4A',
  line: '#4A1408',
}

/**
 * Traced from side views of red-and-white telescopes and fancy goldfish (and the demekin plates): the body an egg
 * about 0.7 as deep as it is long from snout to tail base, the back rising from the short, blunt head to a gentle
 * hump at the dorsal's origin, the belly round and lowest under the pelvic fins, the tail stock short and narrow
 * enough to show the egg. The mouth is small at the front of the snout: the upper lip over the lower, the notch
 * where they meet.
 */
const EDGE =
  'M82.6 33.6 C85.4 30.9 84.9 31 88 28.6 C92 25.5 91.5 25.6 96 23.4 C100.5 21.2 100.1 21.5 105 20.2 C109.1 19.1 108.7 19.2 113 19 ' +
  'C117.2 18.8 116.8 18.7 121 19.4 C125.3 20.2 124.9 20.2 129 21.8 C132.9 23.3 132.4 23.3 136 25.4 C139.3 27.3 138.9 27 142 29.2 ' +
  'C145 31.3 144.8 30.9 147.4 33.4 C149.9 35.7 149.6 35.5 151.6 38.2 C153.5 40.8 153.3 40.5 154.6 43.4 C155.7 45.9 155.8 45.7 156.2 48.4 ' +
  'C156.5 49.4 156.2 50.2 155.6 50.5 L154.8 50.7 C155.6 51 155.8 51.7 155.6 52.4 ' +
  'C155 53.9 155.2 53.9 154.2 55.2 C152.4 57.7 152.7 57.6 150.4 59.6 C147.5 62.2 147.8 61.9 144.4 63.8 C140.1 66.2 140.6 66 136 67.8 ' +
  'C131.4 69.7 131.9 69.6 127 70.8 C121.3 72.2 121.9 72.2 116 72.6 C109.7 73 110.3 73.4 104 72.4 C99 71.6 99.4 71.7 95 69.4 ' +
  'C91.2 67.4 91.7 67.4 88.6 64.4 C85.2 61 85.6 61.3 82.8 57.4'

/** The silhouette and clip: the outline closed by the round end of the tail stock, which carries no outline so the stock flows into the tail. */
const BODY = `${EDGE} C80.8 54 80 49 80 45.5 C80 41.5 80.8 37 82.6 33.6 Z`

/** The red: the head above the cheek, over the nape and a saddle down the flank in two lobes; the rear and the belly white. */
const RED =
  'M162 50.2 L154.8 50.7 C152 52.4 149 53.2 145.4 53 C141.4 52.8 137.2 52.4 133.8 53.2 C130.6 54 128.4 57.4 125.4 59.8 ' +
  'C122.6 62 119.4 62 117.8 59.4 C116.4 57 114.8 54 112 53.8 C109 53.6 108 56.6 105 56.6 C102.4 56.6 101.4 54 100.6 51.4 ' +
  'C99.4 47.4 97.6 43 95.4 39 C93.4 35.4 91.4 31.6 89.6 27.6 L89.6 0 L162 0 Z'

/**
 * The double tail, white and see-through with red rays: a long upper lobe, a rounded fork and the broad lower lobe
 * hanging down and back. The far half lies behind the near one, its lower lobe drooping further (the same lobe
 * turned 9° down), so its end shows under the near lobe.
 */
const NEAR_TAIL =
  'M88 34.6 L82.6 33.6 C76 31 67 27.4 57 24.6 C45 21.4 32 20.6 21 22.4 C15 23.4 10.4 25.4 8.6 28 C7.4 29.8 8.6 31.4 11.6 32 ' +
  'C20 33.8 31 36 40 38.6 C44.6 39.9 48.6 41.2 51.4 43 C49.6 48 46.6 53.4 42.6 58.4 C37 65.6 30.4 72 23.4 77.4 ' +
  'C20.6 79.6 18.6 81.2 18.6 82.4 C18.6 83.6 20.8 83.8 23.8 83 C33.6 80.4 45 76 56.6 70.8 C66.4 66.6 75 61.8 82.8 57.4 L88 57.2 Z'
const FAR_LOBE =
  'M90.4 41.8 L54.3 47.5 C53.3 52.7 51.2 58.5 48 64.1 C43.6 72.1 38.1 79.4 32 85.9 C29.6 88.5 27.9 90.4 28.1 91.6 C28.2 92.7 30.4 92.6 33.3 91.3 ' +
  'C42.6 87.2 53.1 81.1 63.8 74.2 C72.8 68.5 80.5 62.4 87.5 56.8 L92.7 55.8 Z'

/**
 * The tail's rays: along the upper lobe toward its tip, fanning down the lower lobe; they start a little way out from
 * the base, so the tail stock stays clean.
 */
const TAIL_RAYS =
  'M72 34.6 L15.6 25.8 M72 37.8 L19 31.2 M72 41.2 L34 37 M73.4 45.4 L49.2 47 M73.4 47.4 L45 56.6 M73.6 49.2 L38 65.2 ' +
  'M74 50.6 L30.6 72.6 M74.4 51.8 L24.4 79 M75 53 L35 77.2'

/** The dorsal and the pelvic fin, each red at the base and white beyond. */
const DORSAL = 'M117.4 21.8 L115 19.2 C112.6 13 107.6 7.4 101 4 C93 3 84.6 5.2 78.6 10 C81.6 15 84.6 21.4 88 28.4 L91 30.4 Z'
const DORSAL_IN =
  'M117.4 21.8 L115 19.2 C113.8 16 112.6 13.6 111 11.4 C108 12.4 106.4 9.8 104.4 11.2 C102.4 12.6 100.6 10.4 98.2 12 ' +
  'C96 13.4 94.2 11.6 91.8 13.4 C89.6 15 87.6 13.8 85.6 15.8 C84.4 17 83.4 17 82.4 16.6 C84.4 20.6 86.2 24.6 88 28.4 L91 30.4 Z'
const PELVIC = 'M111 71.8 C109.2 78.6 104.8 86.4 97.8 92.4 C96.4 93.4 95 92.8 95.2 91.2 C95.4 85.4 96.4 79 99 72.6 Z'
const PELVIC_IN = 'M111 71.8 C110.4 74.6 109.4 77.4 108 80 C105.6 80.4 104.4 78.6 102.6 80 C100.8 81.4 99 80.2 97 81.4 C97.4 78.4 98 75.4 99 72.6 Z'

/**
 * Kinguio — the red-and-white telescope goldfish (demekin), the big-eyed fancy goldfish: the eyes stand out from the
 * head on short cones, so from the side each is a big disc in a raised red cup. A white body with a red head and a
 * red saddle down the flank; the tall dorsal, the long double tail, long pelvic fins, the double
 * anal fin (its front showing under the tail stock), a white fan of a pectoral. Small mouth at the tip, no barbels.
 */
export const goldfish: FishArt = {
  body: BODY,
  tailPivot: [80, 46],
  tail: [
    part(FAR_LOBE, K.farFin, K.line),
    part('M95 64 C91.6 69.4 87.4 74.4 82.4 78.4 C81 79.4 79.8 78.8 80 77.4 C80.8 73.6 83 69.2 86.8 61.6 Z', K.farFin, K.line, 1.2),
    part(NEAR_TAIL, K.fin),
    stroke(TAIL_RAYS, K.finRay, 0.6),
    stroke(NEAR_TAIL, K.line, 1.6),
  ],
  layers: [
    // dorsal (tall, leaning back over the tail stock), the two long pelvic fins
    part(DORSAL, K.fin),
    part(DORSAL_IN, K.red),
    stroke('M113.4 18.6 L101.4 5.6 M108.6 18.6 L94.6 4.4 M103.6 19.4 L88.4 5.6 M98.6 20.8 L83 8.2 M93.8 23.4 L80.6 11', K.finRay, 0.6),
    stroke(DORSAL, K.line, 1.6),
    part('M106 71 C104.6 77.6 100.4 85 93.8 90.6 C92.4 91.6 91 91 91.2 89.4 C91.4 83.8 92.4 77.6 94.6 71.8 Z', K.farFin, K.line, 1.2),
    part(PELVIC, K.fin),
    part(PELVIC_IN, K.red),
    stroke('M106.4 74 L97.4 90.6 M103.4 74.2 L96.2 88', K.finRay, 0.6),
    stroke(PELVIC, K.line, 1.6),
    part(BODY, K.white),
    stroke(EDGE, K.line, 1.6),
    // body: the shade along the belly, the red head and saddle
    shade('M156 56 C150 59.4 144 62.6 137.6 65.4 C128 69.4 118 71.4 106 71.2 C98 70.8 92 67.6 87.6 63 L84 70 L84 100 L160 100 Z', K.belly),
    shade(RED, K.red),
    // head: the gill-cover arc, the white fan of the pectoral just behind it
    stroke('M134.4 25.8 C129.8 33.6 129 46 131.6 57', K.plate, 1.2),
    part('M131.4 55.6 C126.8 52.6 121 51.8 116.8 53.4 C114.8 54.2 114.2 57 114.8 59.4 C115.6 62.8 117.8 65.4 120.8 66.2 C124 67 127.8 63.8 130.6 60.6 C132 59.2 132.4 56.4 131.4 55.6 Z', K.fin, K.line, 1),
    stroke('M130.6 56.6 L117.4 54 M130.4 57.4 L116 58.4 M130.6 58.4 L117.6 63 M130.8 59.2 L121.4 65.4', K.finRay, 0.55),
    // mouth: the short cleft back from the notch; the eye cup standing out of the forehead, its lit rim, the gold iris ring
    stroke('M154.8 50.7 C154 51 153.2 51.3 152.4 51.4', K.line, 1),
    part('M140.4 43.2 A7.2 7.2 0 1 0 154.8 43.2 A7.2 7.2 0 1 0 140.4 43.2 Z', K.socket, K.line, 1.2),
    stroke('M141.4 40.9 A6.6 6.6 0 0 1 152.7 39.0', K.glow, 1),
    part('M141.6 43.2 A6 6 0 1 0 153.6 43.2 A6 6 0 1 0 141.6 43.2 Z', K.ring),
  ],
  eyes: [{ cx: 147.6, cy: 43.2, r: 4.9 }],
}
