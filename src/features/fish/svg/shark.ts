import { tone } from './helpers'
import type { FishArt } from './types'

/** Tubarão — migrated from the M5 sticker; redrawn in a later task. */
export const shark: FishArt = {
  view: [64, 40],
  body: 'M12 20 C14 10 28 6 42 6 C52 6 60 14 62 20 C58 26 50 32 40 32 C28 32 16 30 12 20 Z',
  tailPivot: [13, 20],
  tail: [{ d: 'M13 20 L2 6 L6 20 L2 32 Z', fill: tone('ink-2') }],
  layers: [
    { d: 'M12 20 C14 10 28 6 42 6 C52 6 60 14 62 20 C58 26 50 32 40 32 C28 32 16 30 12 20 Z', fill: tone('ink-2') },
    { d: 'M28 8 L36 0 L44 6 Z', fill: tone('ink-2') },
    { d: 'M32 30 L28 38 L42 32 Z', fill: tone('ink-2') },
    { d: 'M28 27 C36 32 50 28 58 22 L56 25 C48 32 34 34 28 30 Z', fill: tone('ink') },
  ],
  eyes: [{ cx: 52, cy: 15, r: 2.4 }],
}
