import type { FishArt } from './types'

/** Peixe-dourado — round orange body, yellow double tail (starter). */
export const goldfish: FishArt = {
  body: 'M20 20 C20 10 30 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C30 34 20 30 20 20 Z',
  tail: 'M21 20 C14 12 8 6 4 8 C8 14 10 18 10 20 C10 22 8 26 4 32 C8 34 14 28 21 20 Z',
  tailPivot: [21, 20],
  fins: ['M30 8 L36 0 L44 6 Z'],
  marks: [],
  eyes: [[52, 17]],
  colors: { body: 'accent-orange', tail: 'accent-yellow', fins: 'accent-yellow', marks: 'accent-yellow' },
}
