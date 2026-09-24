import { tone } from './helpers'
import type { FishArt } from './types'

/** Baiacu — migrated from the M5 sticker; redrawn in a later task. */
export const pufferfish: FishArt = {
  view: [64, 40],
  body: 'M12 20 C12 8 22 4 34 4 C46 4 58 10 60 20 C58 30 46 36 34 36 C22 36 12 32 12 20 Z',
  tailPivot: [13, 20],
  tail: [{ d: 'M13 20 L4 14 L6 20 L4 26 Z', fill: tone('accent-yellow') }],
  layers: [
    { d: 'M12 20 C12 8 22 4 34 4 C46 4 58 10 60 20 C58 30 46 36 34 36 C22 36 12 32 12 20 Z', fill: tone('accent-yellow') },
    { d: 'M22 7 L24 1 L27 6 Z', fill: tone('ink-2') },
    { d: 'M32 4 L34 0 L37 4 Z', fill: tone('ink-2') },
    { d: 'M43 6 L46 1 L48 7 Z', fill: tone('ink-2') },
    { d: 'M22 33 L24 39 L27 34 Z', fill: tone('ink-2') },
    { d: 'M32 36 L34 40 L37 36 Z', fill: tone('ink-2') },
    { d: 'M43 34 L46 39 L48 33 Z', fill: tone('ink-2') },
    { d: 'M27 16a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z', fill: tone('accent-orange') },
    { d: 'M36 24a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z', fill: tone('accent-orange') },
    { d: 'M24 26a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z', fill: tone('accent-orange') },
    { d: 'M40 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z', fill: tone('accent-orange') },
  ],
  eyes: [{ cx: 50, cy: 16, r: 2.4 }],
}
