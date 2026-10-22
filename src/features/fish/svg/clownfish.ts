import { part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const K = {
  orange: '#F76F1B',
  back: '#E8620F',
  belly: '#FF8B34',
  fin: '#FA8526',
  finRay: '#D0570F',
  white: '#FBFBF6',
  black: '#17110D',
  ring: '#D2460B',
  lip: '#D9530C',
  line: '#2A1206',
}

/**
 * Traced from lateral photos (iNaturalist, Commons): about 2.3:1 snout to tail base against depth, a blunt
 * rounded head with thick lips and a small terminal mouth, a deep peduncle, eye high and close to the snout.
 */
const BODY =
  'M33.6 40.4 C41 39.6 47 37.4 52 34 C58 30.4 66 27.4 74 25.6 C82 24 91 23 100 23 C108 23 116 24 122 25.4 ' +
  'C129.6 26.2 136.6 27.6 142 29.8 C148 31.8 152.6 35.2 155.2 39.4 C156.6 41.8 157.3 44.2 157.4 46.4 ' +
  'C157.6 47.8 156.8 48.8 154.6 49 C156.4 49.4 157.2 50.4 157 51.8 C156.8 53.6 156 55.4 154.6 57.2 ' +
  'C152.4 59.8 149.2 62.2 145.4 64.4 C140 67.4 134 70 127 72.2 C118.6 74.8 108 76.8 100 77.4 ' +
  'C93 78 86 77.2 80 75.6 C70 73 60 69 52 65.6 C46 63.2 40 62.2 33.6 62 C32.4 55 32.4 47.4 33.6 40.4 Z'

const TAIL = 'M42 41 C36 40 30 37.6 24 34 C19 31.2 14 29.6 11 30 C8.4 30.4 7 33.6 6.4 38 C5.8 42.8 5.6 47 5.6 51 C5.6 55 5.8 59.2 6.4 64 C7 68.4 8.4 71.6 11 72 C14 72.4 19 70.8 24 68 C30 64.4 36 62 42 61 Z'
/** One dorsal: the spiny part from the nape with the spine tips standing out, the notch, the rounded soft part. */
const DORSAL =
  'M121 30 L120.4 25.6 L117.6 18.6 Q115.6 16.9 114.2 14.4 Q111.8 13.8 109.8 12 Q107.1 12.2 104.6 11.2 Q102 12 99.4 11.6 ' +
  'Q97.1 13 94.4 13.2 Q92.6 15.3 90.2 16.4 Q88.4 20.4 85.2 21.6 C83.6 20.4 81 18.8 77.6 17.8 C73 16.6 66 16.4 58 17.2 ' +
  'C52 17.8 46.8 19.6 43.4 22.6 C40.4 25.4 39.6 30.4 40.4 34.4 C41 37.6 42.6 39.8 45 41 L80 31 Z'
const ANAL = 'M82 72 C80 76.6 76 80.6 70 83.2 C64 85.2 56 85.2 50 83.4 C45.6 82 43 79 42.2 75.2 C41.6 71.6 42.4 68 44 64.6 L46 60 L82 68 Z'
const BANDS =
  'M142 27.6 C138.4 31.4 133.8 34.6 132.6 39 C131.2 44 131 49 132.2 52.8 C133.4 56.8 136 60.4 139.6 63.8 L142.9 66.9 ' +
  'M131.6 74 C127.2 66 123.8 60.4 122.4 54.4 C121 48.4 121.2 41.6 123.6 35.8 C125.2 31.6 127.6 28.2 130.4 23 ' +
  'M70.4 20 C71.6 32 72.4 46 74 58 C75 66 76.4 74 78.4 82 ' +
  'M89.2 82 C88 74 87.8 66 88.8 60 C89.8 55.4 92.6 51 96 46.6 C96.6 45.6 96.4 44.8 95.6 44 C92.4 40.4 88.6 34.4 86.2 28 C85.2 25.4 84.6 22.6 84.2 20 ' +
  'M42.4 34 C43.4 40 44.2 46 44.2 51 C44.2 56 43.4 62 42.4 68'

/**
 * Peixe-palhaço — Amphiprion ocellaris, the anemone's resident. Orange, three white bands edged in thin
 * black (the head band behind the eye, the middle one with its forward bulge and running up into the
 * dorsal notch, one at the tail base), rounded fins and tail with black margins, the spiny dorsal taller
 * than the soft one.
 */
export const clownfish: FishArt = {
  body: BODY,
  tailPivot: [36, 51],
  tail: [
    part(TAIL, K.fin, K.black, 2.6),
    rays([38, 51], [[11, 31.6], [8, 37], [6.6, 44], [6.2, 51], [6.6, 58], [8, 65], [11, 70.4]], K.finRay, 0.86, 0.8),
  ],
  layers: [
    // dorsal: spines and soft rays, the white of the middle band in the notch, then the black margin on top
    part(DORSAL, K.fin),
    rays([106, 36], [[117.6, 18.6], [114.2, 14.4], [109.8, 12], [104.6, 11.2], [99.4, 11.6], [94.4, 13.2], [90.2, 16.4]], K.finRay, 0.93, 0.8),
    rays([70, 42], [[80, 20.4], [74, 18], [67, 17.4], [60, 17.8], [53, 18.8], [46.6, 21.6], [42.4, 27]], K.finRay, 0.86, 0.8),
    part('M70.9 25 C71.6 22.4 72.6 19.6 74 17.1 C75.4 17.2 76.6 17.5 77.6 17.8 C81 18.8 83.6 20.4 85.2 21.6 C85.8 21.1 86.4 20.6 87 20 C86.4 21.8 85.8 23.4 85.4 25 Z', K.white),
    stroke('M70.9 25 C71.6 22.4 72.6 19.6 74 17.1 M85.4 25 C85.8 23.4 86.4 21.8 87 20', K.black, 1.1),
    stroke(DORSAL, K.black, 2.4),
    // anal and pelvic
    part(ANAL, K.fin, K.black, 2.6),
    rays([64, 62], [[76, 80.6], [70, 83.2], [63, 84.6], [56, 84.4], [49.6, 82.6], [45, 79], [43, 73.4]], K.finRay, 0.86, 0.8),
    part('M118.8 71.6 C117.6 77.6 115.4 83.6 112.8 88 C110.8 91 106.4 91.2 103.8 88.4 C102.8 87.2 103.6 85.4 104.8 83.4 C107 79.8 109.2 77 111 74.6 Z', K.fin, K.black, 2.4),
    rays([115, 73], [[111.6, 88], [108.4, 89.6], [105, 88.4]], K.finRay, 0.85, 0.8),
    part(BODY, K.orange, K.line),
    // body: the deeper orange back, the lighter belly
    shade('M32 44.6 C40 43.6 46 41.4 52 38.4 C62 33.6 72 31 84 30 C98 28.8 112 29 122 29.6 C128 30 134 30 140 26 L140 0 L30 0 Z', K.back),
    shade('M158 55 C150 61 140 67 124 69.6 C108 72 92 73.4 78 72 C64 70.6 52 65.6 40 63 L30 63 L30 100 L160 100 Z', K.belly),
    // the three white bands and their thin black edges
    shade(
      'M142 27.6 C138.4 31.4 133.8 34.6 132.6 39 C131.2 44 131 49 132.2 52.8 C133.4 56.8 136 60.4 139.6 63.8 L142.9 66.9 L131.6 74 C127.2 66 123.8 60.4 122.4 54.4 C121 48.4 121.2 41.6 123.6 35.8 C125.2 31.6 127.6 28.2 130.4 23 Z ' +
        'M70.4 20 C71.6 32 72.4 46 74 58 C75 66 76.4 74 78.4 82 L89.2 82 C88 74 87.8 66 88.8 60 C89.8 55.4 92.6 51 96 46.6 C96.6 45.6 96.4 44.8 95.6 44 C92.4 40.4 88.6 34.4 86.2 28 C85.2 25.4 84.6 22.6 84.2 20 Z ' +
        'M42.4 34 C43.4 40 44.2 46 44.2 51 C44.2 56 43.4 62 42.4 68 L28 68 L28 34 Z',
      K.white,
    ),
    { ...stroke(BANDS, K.black, 1.1), clip: true },
    // pectoral: a rounded fan behind the head band, a thin black margin along its outer edge
    part('M120.6 47.6 C114.6 43.2 106 42.4 100 45.2 C96 47.2 95 52 96.6 57.6 C98.4 63.8 103.6 68.8 110 69.8 C114.8 70.4 118 66.6 119.6 62 C121 57.4 121.4 51.6 120.6 47.6 Z', K.black, K.line, 1.2),
    part('M120.6 47.6 C114.8 44.2 106.6 43.4 100.8 46.2 C97.4 48 96.6 52.4 98 57.4 C99.6 63 104.2 67.6 110 68.6 C114.4 69.2 117.4 65.8 119 61.8 C120.6 57.4 121.4 51.6 120.6 47.6 Z', K.fin),
    rays([121, 54], [[103, 46], [99, 50.4], [98.4, 56], [100.4, 61.8], [104.6, 66.2], [110, 68]], K.finRay, 0.88, 0.8),
    // head: the groove behind the thick upper lip, the mouth cleft running back from the notch between the lips, the iris ring
    stroke('M155.6 42.6 C153.6 43.8 152 45.8 151.2 48.4', K.lip, 0.8),
    stroke('M154.6 49 C153.4 49.2 152.2 49.6 151 50.2', K.line, 1.1),
    part('M135.6 38 A3.9 3.9 0 1 0 143.4 38 A3.9 3.9 0 1 0 135.6 38 Z', K.ring),
  ],
  eyes: [{ cx: 139.5, cy: 38, r: 2.9 }],
}
