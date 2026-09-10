import type { FishArt } from './types'

/** Peixe-anjo — tall silver disc, yellow sail fins, dark bars (sequência de 100 dias). */
export const angelfish: FishArt = {
  body: 'M20 20 C20 12 28 8 36 8 C46 8 54 14 58 20 C54 26 46 32 36 32 C28 32 20 28 20 20 Z',
  tail: 'M21 20 L8 10 L11 20 L8 30 Z',
  tailPivot: [21, 20],
  fins: ['M26 10 C28 0 42 0 48 9 Z', 'M26 30 C28 40 42 40 48 31 Z'],
  marks: ['M31 9 L29 31 L33 31 L35 9 Z', 'M43 9 L41 31 L45 31 L47 9 Z'],
  eyes: [[50, 17]],
  colors: { body: 'ink-2', tail: 'accent-yellow', fins: 'accent-yellow', marks: 'ink' },
}
