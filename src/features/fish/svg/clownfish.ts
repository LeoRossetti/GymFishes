import type { FishArt } from './types'

/** Peixe-palhaço — orange with two white bands (sequência de 30 dias). */
export const clownfish: FishArt = {
  body: 'M16 20 C16 10 26 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C26 34 16 30 16 20 Z',
  tail: 'M17 20 C12 12 8 12 4 14 C6 18 6 22 4 26 C8 28 12 28 17 20 Z',
  tailPivot: [17, 20],
  fins: ['M28 8 L34 1 L42 7 Z', 'M28 32 L34 39 L42 33 Z'],
  marks: ['M25 9 C24 16 24 24 25 31 L29 31 C28 24 28 16 29 9 Z', 'M41 7 C40 15 40 25 41 33 L45 33 C44 25 44 15 45 7 Z'],
  eyes: [[52, 17]],
  colors: { body: 'accent-orange', tail: 'accent-orange', fins: 'accent-orange', marks: 'ink' },
}
