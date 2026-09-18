import type { FishArt } from './types'

/** Neon — slim silver body, an electric blue stripe over a pink one (starter). */
export const neon: FishArt = {
  body: 'M16 20 C16 14 26 10 38 10 C48 10 56 15 60 20 C56 25 48 30 38 30 C26 30 16 26 16 20 Z',
  tail: 'M17 20 L6 12 L9 20 L6 28 Z',
  tailPivot: [17, 20],
  fins: ['M20 23 C30 27 46 27 55 22 L55 26 C46 31 30 31 20 27 Z'],
  marks: ['M18 17 C28 13 46 13 56 17 L56 20 C46 16 28 16 18 20 Z'],
  eyes: [[52, 17]],
  colors: { body: 'ink-2', tail: 'ink-2', fins: 'accent-pink', marks: 'accent-blue' },
}
