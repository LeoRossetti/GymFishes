import { tone } from './helpers'
import type { FishArt } from './types'

/** Neon — migrated from the M5 sticker; redrawn in a later task. */
export const neon: FishArt = {
  view: [64, 40],
  body: 'M16 20 C16 14 26 10 38 10 C48 10 56 15 60 20 C56 25 48 30 38 30 C26 30 16 26 16 20 Z',
  tailPivot: [17, 20],
  tail: [{ d: 'M17 20 L6 12 L9 20 L6 28 Z', fill: tone('ink-2') }],
  layers: [
    { d: 'M16 20 C16 14 26 10 38 10 C48 10 56 15 60 20 C56 25 48 30 38 30 C26 30 16 26 16 20 Z', fill: tone('ink-2') },
    { d: 'M20 23 C30 27 46 27 55 22 L55 26 C46 31 30 31 20 27 Z', fill: tone('accent-pink') },
    { d: 'M18 17 C28 13 46 13 56 17 L56 20 C46 16 28 16 18 20 Z', fill: tone('accent-blue') },
  ],
  eyes: [{ cx: 52, cy: 17, r: 2.4 }],
}
