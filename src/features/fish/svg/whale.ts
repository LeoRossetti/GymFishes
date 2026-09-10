import type { FishArt } from './types'

/** Baleia — big blue body, pale belly, broad tail (ganhar 3 meses). */
export const whale: FishArt = {
  body: 'M8 22 C8 10 22 6 38 6 C52 6 62 14 62 22 C62 28 56 32 46 32 L20 32 C12 32 8 28 8 22 Z',
  tail: 'M9 22 C4 14 0 14 0 18 C2 20 2 24 0 28 C4 30 8 28 9 22 Z',
  tailPivot: [9, 22],
  fins: ['M28 30 L24 38 L36 32 Z'],
  marks: ['M20 28 C30 34 48 32 58 26 L56 29 C46 36 28 36 20 31 Z'],
  eyes: [[52, 18]],
  colors: { body: 'accent-blue', tail: 'accent-blue', fins: 'accent-blue', marks: 'ink-2' },
}
