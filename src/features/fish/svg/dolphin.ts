import type { FishArt } from './types'

/** Golfinho — sleek light grey with a pale belly (1000 L acumulados). */
export const dolphin: FishArt = {
  body: 'M12 22 C14 12 26 8 40 8 C50 8 58 14 62 20 L54 22 C50 28 40 32 28 30 C20 28 14 26 12 22 Z',
  tail: 'M13 22 C8 16 2 16 2 20 C4 22 4 24 2 28 C6 30 10 26 13 22 Z',
  tailPivot: [13, 22],
  fins: ['M30 9 C32 2 40 0 42 8 Z', 'M30 28 L28 36 L38 30 Z'],
  marks: ['M24 27 C34 31 46 29 54 23 L52 25 C44 31 32 33 24 29 Z'],
  eyes: [[52, 15]],
  colors: { body: 'ink-2', tail: 'ink-2', fins: 'ink-2', marks: 'ink' },
}
