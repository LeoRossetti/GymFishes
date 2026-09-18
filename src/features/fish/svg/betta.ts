import type { FishArt } from './types'

/** Betta — purple body with long pink veil fins (starter). */
export const betta: FishArt = {
  body: 'M18 20 C18 12 28 8 38 8 C48 8 56 14 58 20 C56 26 48 32 38 32 C28 32 18 28 18 20 Z',
  tail: 'M19 20 C14 6 6 4 2 10 C4 16 4 24 2 30 C6 36 14 34 19 20 Z',
  tailPivot: [19, 20],
  fins: ['M24 12 C26 2 40 0 48 8 C40 8 30 10 24 12 Z', 'M24 28 C26 38 40 40 48 32 C40 32 30 30 24 28 Z'],
  marks: [],
  eyes: [[50, 17]],
  colors: { body: 'accent-purple', tail: 'accent-pink', fins: 'accent-pink', marks: 'accent-pink' },
}
