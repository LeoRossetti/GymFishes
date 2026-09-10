import type { FishArt } from './types'

/** Guppy — a small blue body under a big orange fan tail (starter). */
export const guppy: FishArt = {
  body: 'M24 20 C24 12 32 8 40 8 C50 8 58 14 60 20 C58 26 50 32 40 32 C32 32 24 28 24 20 Z',
  tail: 'M25 20 C16 8 8 4 2 8 C6 14 6 26 2 32 C8 36 16 32 25 20 Z',
  tailPivot: [25, 20],
  fins: ['M32 10 L38 3 L46 9 Z'],
  marks: [
    'M39.5 14a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M34 24a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
    'M44.2 26a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0Z',
  ],
  eyes: [[52, 17]],
  colors: { body: 'accent-blue', tail: 'accent-orange', fins: 'accent-orange', marks: 'accent-orange' },
}
