import { dots, part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const T = {
  gold: '#D9B23C',
  back: '#7E7A34',
  belly: '#F0EAD0',
  scale: '#B8962E',
  bar: '#2B2718',
  fin: '#7C7A45',
  finRay: '#4A4828',
  red: '#D8452B',
  redRay: '#9C2E1C',
  pec: '#C9B25A',
  ocellus: '#1C1A12',
  ocRing: '#F3C63E',
  ring: '#D2482C',
  line: '#1E1C10',
}

/** Traced from side photos: about 2.8:1, a deep peduncle, a long head with a straight forehead, thick lips and the lower jaw out front, long dorsal (spiny front, tall soft rear), a broad tail as tall as the body. */
const BODY = 'M37 40.4 C48 36 62 32 80 29.6 C98 27.6 110 27.2 121 28.4 C131 30 141 36 148.6 43.6 C151.6 46.6 154.6 49.4 156.6 51.4 C157.6 52.6 157.4 54.2 156.4 54.9 L156 55.2 C157.4 55 158.8 55 159.4 55.6 C159.6 56.4 158.6 57.2 156.8 57.8 C152 58.8 146 59.8 141 60.8 C133 62.6 124 67.6 112 70.6 C98 72.6 82 71.4 68 68 C56 65.4 45 62 37 59 C34.4 53.6 34.4 46 37 40.5 Z'

/**
 * Tucunaré — the peacock bass. Golden body, olive back, three black bars down the flank, the black
 * eye-spot ringed in gold at the base of the tail, red belly fins and a red eye.
 */
export const tucunare: FishArt = {
  body: BODY,
  tailPivot: [38, 50],
  tail: [
    part('M38.4 41 C31 36.4 22 31 14.6 29.4 C8.8 28.2 5.2 33 4.4 40 C3.8 46.6 3.8 53.4 4.4 60 C5.2 67 8.8 71.8 14.6 70.6 C22 69 31 63.6 38.4 59 Z', T.fin, T.line),
    rays([38, 50], [[14, 31.4], [8.6, 36.6], [6, 43.6], [5.4, 50], [6, 56.4], [8.6, 63.4], [14, 68.6]], T.finRay, 0.9),
    part('M5.4 63.6 C6.6 68.6 9.6 71.4 14.6 70.6 C22 69 31 63.6 37.8 59.4 L37.4 56.4 C27 61.6 16 64.4 5.4 63.6 Z', T.red),
    part('M24.2 46.6 A5.6 5.6 0 1 0 35.4 46.6 A5.6 5.6 0 1 0 24.2 46.6 Z', T.ocRing, T.line, 0.8),
    part('M26 46.6 A3.8 3.8 0 1 0 33.6 46.6 A3.8 3.8 0 1 0 26 46.6 Z', T.ocellus),
  ],
  layers: [
    // dorsal: spiny front, the notch, the tall soft lobe over the peduncle
    part('M119 28.3 C117.6 25 115.6 22.4 113.6 20.6 L110.6 21.6 L106 19.8 L102.6 21 L98.4 19.6 L95 20.8 L91 19.8 L87.8 21 L84.4 20.6 C83 22 81.6 23.2 80.4 24.6 C76.4 20.6 71 18.2 64.6 18 C57 18 51 21.6 47.6 27.6 C46.2 31 45.4 34.4 45.4 37.6 C60 31.5 85 27 119 28.3 Z', T.fin, T.line),
    stroke('M113.6 27.8 L113.4 21.4 M106 27.6 L106 20.6 M98.4 27.8 L98.4 20.4 M91 28.4 L91 20.6 M84.4 29 L84.4 21.4', T.finRay, 0.9),
    rays([68, 33], [[77.6, 23.6], [72, 19.6], [64.6, 18.8], [57, 20], [51.4, 23.6], [47.8, 29.4]], T.finRay, 0.9),
    // anal and pelvic: red
    part('M72 67.6 C70 72.5 66 76 60 77.5 C54 78.5 48.5 76.5 45 72.5 C43.5 70.5 43 68.5 43.5 61.5 C52 64.5 61 66.5 72 67.6 Z', T.red, T.line),
    rays([60, 66], [[64.6, 75], [58.6, 77.4], [52.6, 76.6], [47.4, 73]], T.redRay, 0.85),
    part('M114 70.8 C110 75.5 104 80 97 82.8 C95 83.5 94 82.2 95 81 C99 77 102 73.5 103 71.6 Z', T.red, T.line),
    part(BODY, T.gold, T.line),
    // body: olive back, white belly, small scales, the three bars
    shade('M30 0 L160 0 L160 30 C146 35 128 35.6 110 36.4 C86 37.6 60 40.6 30 46 Z', T.back),
    shade('M30 61 C56 65.6 80 67.4 100 66.8 C118 64.4 140 61.4 160 57.8 L160 92 L30 92 Z', T.belly),
    ...scaleRows({ x0: 38, x1: 113, y0: 30, rows: 10, dy: 3.2, dx: 3.6, r: 1.4, color: () => T.scale, width: 0.5 }),
    shade(
      'M95 27.4 C98.4 27.0 103.6 27.0 107 27.4 C107.4 34.4 105.4 39.4 106 43.4 C106.6 48.4 103.8 57.6 101.4 64.6 C100.6 64.6 98.2 57.6 96.4 43.4 C96.8 39.4 94.4 34.4 95 27.4 Z ' +
        'M71.6 29.2 C75.0 28.8 79.2 28.8 82.6 29.2 C83.0 36.2 81.0 41.2 81.6 45.2 C82.2 50.2 79.7 57.4 77.5 64.4 C76.7 64.4 74.5 57.4 73.0 45.2 C73.4 41.2 71.0 36.2 71.6 29.2 Z ' +
        'M50.6 33 C54.0 32.6 57.0 32.6 60.4 33 C60.8 40 58.8 45 59.4 49 C60.0 54 57.9 55.4 55.9 62.4 C55.1 62.4 53.1 55.4 52.0 49 C52.4 45 50.0 40 50.6 33 Z',
      T.bar,
    ),
    // head: gill cover, pale throat, lips and gape, the red eye
    stroke('M130.6 32.8 C125 42 125.2 54 131 63.4', T.scale, 0.9),
    part('M120 51.4 C112 53 105 57.2 99.6 62.4 C106.4 63 113.6 60.4 120.6 56.4 C121.8 54.6 121.6 52.2 120 51.4 Z', T.pec, T.line, 1),
    stroke('M121 29 C112.6 41 112.8 57 121 69.4', T.back, 1.3),
    // mouth: the thick upper lip above the gape, the gape low and running back to below the eye, a thin bass jaw under it
    stroke('M156.6 52.2 C152.6 53.6 147.6 54.8 142.6 55.8', T.back, 0.8),
    stroke('M156 55.2 C151.6 56.4 146.4 57.6 141.2 58.6', T.line, 1.2),
    dots([[147.4, 45.6, 0.8]], T.line),
    part('M133.8 43 A4.6 4.6 0 1 0 143 43 A4.6 4.6 0 1 0 133.8 43 Z', T.ring),
  ],
  eyes: [{ cx: 138.4, cy: 43, r: 3.7 }],
}
