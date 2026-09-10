import type { FishArt } from './types'

/** Tartaruga — green shell with dark plates, head to the right (500 L acumulados). */
export const turtle: FishArt = {
  body: 'M14 20 C14 10 24 6 34 6 C44 6 54 10 54 20 C54 26 44 30 34 30 C24 30 14 26 14 20 Z',
  tail: 'M15 18 L8 20 L15 22 Z',
  tailPivot: [15, 20],
  fins: [
    'M54 20 C54 16 57 13 61 15 C63 17 63 23 61 25 C57 27 54 24 54 20 Z',
    'M22 28 L16 36 L28 31 Z',
    'M46 28 L52 36 L40 31 Z',
    'M22 12 L16 4 L28 9 Z',
    'M46 12 L52 4 L40 9 Z',
  ],
  marks: ['M28 12 L40 12 L44 20 L40 26 L28 26 L24 20 Z', 'M18 16 L24 14 L22 22 L18 22 Z', 'M50 16 L44 14 L46 22 L50 22 Z'],
  eyes: [[59, 18]],
  colors: { body: 'accent-green', tail: 'accent-green', fins: 'accent-green', marks: 'ink-on-water' },
}
