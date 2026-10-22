import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const N = {
  silver: '#BCCCD5',
  belly: '#EEF3F5',
  back: '#4A5B53',
  blue: '#2394FF',
  glint: '#8DEBFF',
  red: '#EC2A33',
  fin: '#CFDEE6',
  finRay: '#9DB2BE',
  finEdge: '#FAFCFD',
  gill: '#8396A0',
  ring: '#6AA6B8',
  line: '#1A262B',
}

/**
 * Traced from lateral photos (Commons "Paracheirodon innesi (aka)" and "Paracheirodon innesi neon tetra",
 * iNaturalist), not deepened: about 4:1 snout to tail tip against depth, deepest at the dorsal origin, a short
 * blunt head (a fifth of the body) with the big eye 13 units behind the snout, a small terminal mouth, a slim peduncle.
 * The outline, open at the tail stalk.
 */
const EDGE =
  'M28 43 C29.3 42.9 33 43 36 42.6 C39 42.2 42.3 41.1 46 40.4 C49.7 39.7 54 39 58 38.3 C62 37.6 66.3 36.8 70 36 ' +
  'C73.7 35.2 76.7 34.3 80 33.4 C83.3 32.5 86.7 31 90 30.6 C93.3 30.2 96.3 30.7 100 31 C103.7 31.3 108 31.8 112 32.5 ' +
  'C116 33.2 120.3 34.2 124 35.2 C127.7 36.2 130.5 37.4 134 38.6 C137.5 39.8 142.1 41.2 145 42.2 C147.9 43.2 149.7 43.8 151.4 44.7 ' +
  'C153.1 45.6 154.4 46.6 155.4 47.6 C156.6 48.8 157.5 50.6 157.6 52.2 C157.6 53 157.3 53.4 156.7 53.6 ' +
  'C157.1 53.9 157.1 54.5 156.8 55.1 C156.5 55.7 156.1 56.2 155.6 56.8 C154.6 57.8 153.6 58.8 152 59.7 ' +
  'C150.1 60.7 147.8 61.5 145 62.3 C142.2 63.1 138.8 63.8 135 64.6 C131.2 65.4 126.2 66.2 122 66.9 ' +
  'C117.8 67.6 113.7 68.1 110 68.5 C106.3 68.9 103.3 69.2 100 69.4 C96.7 69.6 93.3 69.7 90 69.5 ' +
  'C86.7 69.3 83 69 80 68.5 C77 68 75 67.3 72 66.6 C69 65.9 65.7 65.1 62 64.1 C58.3 63 53.7 61.4 50 60.3 ' +
  'C46.3 59.1 42.8 57.9 40 57.2 C37.2 56.5 35 56.2 33 56 C31 55.8 28.8 55.8 28 55.8'

/** The silhouette and clip: the edge closed by the round end of the tail stalk, which carries no outline so the stalk flows into the tail. */
const BODY = `${EDGE} C25.6 52.6 25.6 46.2 28 43 Z`

/** The blue line: from the top of the eye, thickest under the dorsal, tapering out at the adipose fin. */
const STRIPE =
  'M141.4 44.8 C140.3 44.5 137.7 43.8 135 43.3 C132.3 42.8 129.2 42.3 125 41.9 C120.8 41.5 115 41 110 40.7 ' +
  'C105 40.4 100 40.3 95 40.3 C90 40.3 84.8 40.4 80 40.5 C75.2 40.6 70 40.9 66 41.1 C62 41.3 58.8 41.6 56 41.9 ' +
  'C53.2 42.2 50.9 42.6 49 43 C47.1 43.4 45.2 44.2 44.4 44.4 C45.3 44.6 47.3 45.4 49.6 45.8 C51.9 46.2 54.9 46.6 58 46.9 ' +
  'C61.1 47.2 64.3 47.4 68 47.6 C71.7 47.8 75.5 47.8 80 47.9 C84.5 48 90 48 95 48 C100 48 105 48 110 48 ' +
  'C115 48 120.8 48.2 125 48.3 C129.2 48.4 132.2 48.6 135 48.8 C137.8 49 140.5 49.3 141.6 49.4 Z'

/** The red band: an oblique front end under the dorsal origin, the lower edge reaching the belly from the anal fin back. */
const RED =
  'M90.6 50.4 C88.6 50.4 84.7 50.3 80 50.3 C75.3 50.2 69 50.2 64 50.1 C59 50 54 49.7 50 49.4 C46 49.1 43 48.7 40 48.3 ' +
  'C37 47.9 35 47.4 32 47 C29 46.6 23.7 46 22 45.8 L22 63 C25 62.4 35.3 59.7 40 59.4 C44.7 59.1 47 60.5 50 61.2 ' +
  'C53 61.9 55.3 63.2 58 63.6 C60.7 64 63 63.9 66 63.8 C69 63.7 72.7 63.5 76 62.8 C79.3 62.1 83.3 60.8 86 59.6 ' +
  'C88.4 58.2 90 56.8 91.4 55.4 C92.6 54.2 93.4 53 93.8 52.2 C94.2 51 92.8 50.4 90.6 50.4 Z'

/**
 * Neon — Paracheirodon innesi, the little Amazon tetra. Dark olive back, the electric-blue
 * line from the eye to the adipose fin, the red band on the lower rear half from mid-body to the
 * tail (the cardinal's runs the full length; the neon's belly stays silver-white in front), the big eye in a
 * blue-silver iris, clear fins (tall raked dorsal, adipose, falcate anal, pelvic, forked tail) with white
 * leading edges on the anal and pelvic. Its pectorals are glass-clear and barely show in photos: not drawn.
 */
export const neon: FishArt = {
  body: BODY,
  tailPivot: [28.5, 49.4],
  tail: [
    part(
      'M36 45 C31 44.2 28 43 24.8 41.4 C19 38.2 12.4 33.6 7.4 29.4 C6 28.4 4.8 29.2 5.4 30.8 C7.4 36.4 11.2 42 15.6 46.4 ' +
        'C16.6 47.4 17.6 48.6 18.2 49.6 C17.6 50.6 16.6 51.8 15.6 52.8 C11.2 57.2 7.2 62.8 5 68.6 C4.4 70.2 5.6 71 7 70 ' +
        'C12.2 65.8 18.8 61 24.8 57.4 C27.8 55.8 31 54.6 36 53.8 Z',
      N.fin,
      N.line,
      1,
    ),
    rays([30, 49.6], [[7.4, 31], [10, 36.4], [13.4, 41.8], [16.8, 47], [16.8, 52.2], [13.4, 57.4], [10, 62.8], [7, 68.4]], N.finRay, 0.92, 0.7),
  ],
  layers: [
    // dorsal (tall, raked back), adipose, anal (long base, long front lobe, white leading ray), pelvic — all clear
    part('M91.6 31.4 C87.6 26.2 80.4 19 72.6 14 C71.2 13.1 70 13.6 70 15 C70.2 20.6 71 26.6 72.8 30.8 C73.8 32.8 75.4 34.6 77.2 35.4 Z', N.fin, N.line, 1),
    rays([85, 36], [[71.2, 15.4], [71.2, 20], [71.8, 24.6], [72.8, 29]], N.finRay, 0.92, 0.7),
    part('M48.2 40.8 C47.2 37.8 43.8 36.2 40.4 36.8 C39.8 38.6 40.2 40.4 41.4 41.8 Z', N.fin, N.line, 1),
    part('M78.6 67 C74.6 71.8 69.6 77.2 64.8 81.6 C63.8 82.6 62.6 82.2 62.6 81 C61.4 77.4 59.4 74 56.4 71.4 C52.4 68 47.8 63.6 44 58.4 Z', N.fin, N.line, 1),
    rays([73, 61], [[63.6, 80.4], [60.6, 76.4], [57.4, 72.6], [53.6, 69.2], [49.8, 65.6], [46.4, 61.6]], N.finRay, 0.92, 0.7),
    stroke('M77 69 C73.6 72.8 69.2 77.6 64.8 81.2', N.finEdge, 0.9),
    part('M98.6 68.8 C96.2 73.2 93.4 77.8 90.4 82 C89.6 83 88.4 82.6 88.6 81.4 C88.8 77.8 89.6 73.4 91.6 69.2 Z', N.fin, N.line, 1),
    rays([95, 66], [[89.8, 81.2], [89.4, 77], [90, 72.8]], N.finRay, 0.92, 0.6),
    stroke('M97.4 71 C95.4 74.6 93 78.4 90.6 81.6', N.finEdge, 0.8),
    part(BODY, N.silver),
    stroke(EDGE, N.line, 1.6),
    // body: white belly in front; the dark back (dipping to meet the red behind); the red band; the blue line and its glint
    shade('M160 55.4 C150 58.4 138 60.4 124 61.8 C110 62.8 96 63.2 84 63.8 C70 64.4 50 63 20 61 L20 92 L160 92 Z', N.belly),
    shade('M20 0 L160 0 L160 49.4 C157 49.4 154.6 47 151 45.6 C147 44.4 142 44.6 136 44.6 C124 44.4 112 44.4 102 45.4 C98 46 96 47.4 94 48.4 C92 49.4 90 50.6 86 51 C76 51.2 50 51 20 51.4 Z', N.back),
    shade(RED, N.red),
    shade(STRIPE, N.blue),
    shade('M137 45.8 C124 43.6 108 42.6 92 42.6 C78 42.6 64 43.2 54 44.2 C64 45 78 45.2 92 45.2 C108 45.2 124 45.6 137 45.8 Z', N.glint),
    // head: the gill-cover arc, the short gape running back from the notch, nostril, the blue-silver iris ring
    stroke('M130.4 49.4 C128.2 53.6 128.4 58.6 131 62.8', N.gill, 1.1),
    stroke('M156.7 53.6 C155.9 53.8 155 54 154.1 54.2', N.line, 0.9),
    dots([[151.8, 47.2, 0.6]], N.line),
    part('M137.9 50.8 A6.3 6.3 0 1 0 150.5 50.8 A6.3 6.3 0 1 0 137.9 50.8 Z', N.ring),
  ],
  eyes: [{ cx: 144.2, cy: 50.8, r: 4.7 }],
}
