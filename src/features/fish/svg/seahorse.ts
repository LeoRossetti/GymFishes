import type { FishArt } from './types'

/** Cavalo-marinho — yellow S-curve facing right, orange snout and back fin, curled tail (100 L acumulados). */
export const seahorse: FishArt = {
  body: 'M36 6 C44 6 48 12 46 18 C44 22 40 24 38 26 L38 32 C38 36 34 40 28 38 C33 37 34 34 34 30 L34 26 C28 24 24 18 26 12 C28 8 32 6 36 6 Z',
  tail: 'M30 37 C26 40 20 36 24 32 C26 34 28 36 30 37 Z',
  tailPivot: [30, 37],
  fins: ['M46 14 L58 16 L46 19 Z', 'M26 14 C18 12 16 22 26 22 Z'],
  marks: [],
  eyes: [[39, 13]],
  colors: { body: 'accent-yellow', tail: 'accent-yellow', fins: 'accent-orange', marks: 'accent-orange' },
}
