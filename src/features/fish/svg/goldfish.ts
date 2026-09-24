import { tone } from './helpers'
import type { FishArt } from './types'

/** Peixe-dourado — migrated from the M5 sticker; redrawn in a later task. */
export const goldfish: FishArt = {
  view: [64, 40],
  body: 'M20 20 C20 10 30 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C30 34 20 30 20 20 Z',
  tailPivot: [21, 20],
  tail: [{ d: 'M21 20 C14 12 8 6 4 8 C8 14 10 18 10 20 C10 22 8 26 4 32 C8 34 14 28 21 20 Z', fill: tone('accent-yellow') }],
  layers: [
    { d: 'M20 20 C20 10 30 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C30 34 20 30 20 20 Z', fill: tone('accent-orange') },
    { d: 'M30 8 L36 0 L44 6 Z', fill: tone('accent-yellow') },
  ],
  eyes: [{ cx: 52, cy: 17, r: 2.4 }],
}
