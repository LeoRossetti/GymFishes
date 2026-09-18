import type { FishArt } from './types'

/** Baiacu — a yellow ball with spikes and orange spots (sequência de 7 dias). */
export const pufferfish: FishArt = {
  body: 'M12 20 C12 8 22 4 34 4 C46 4 58 10 60 20 C58 30 46 36 34 36 C22 36 12 32 12 20 Z',
  tail: 'M13 20 L4 14 L6 20 L4 26 Z',
  tailPivot: [13, 20],
  fins: [
    'M22 7 L24 1 L27 6 Z',
    'M32 4 L34 0 L37 4 Z',
    'M43 6 L46 1 L48 7 Z',
    'M22 33 L24 39 L27 34 Z',
    'M32 36 L34 40 L37 36 Z',
    'M43 34 L46 39 L48 33 Z',
  ],
  marks: [
    'M27 16a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M36 24a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M24 26a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
    'M40 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
  ],
  eyes: [[50, 16]],
  colors: { body: 'accent-yellow', tail: 'accent-yellow', fins: 'ink-2', marks: 'accent-orange' },
}
