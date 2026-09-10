import type { FishArt } from './types'

/** Tubarão — dark grey, pointed fins, lighter belly (ganhar 1 mês). */
export const shark: FishArt = {
  body: 'M12 20 C14 10 28 6 42 6 C52 6 60 14 62 20 C58 26 50 32 40 32 C28 32 16 30 12 20 Z',
  tail: 'M13 20 L2 6 L6 20 L2 32 Z',
  tailPivot: [13, 20],
  fins: ['M28 8 L36 0 L44 6 Z', 'M32 30 L28 38 L42 32 Z'],
  marks: ['M28 27 C36 32 50 28 58 22 L56 25 C48 32 34 34 28 30 Z'],
  eyes: [[52, 15]],
  colors: { body: 'ink-3', tail: 'ink-3', fins: 'ink-3', marks: 'ink-2' },
}
