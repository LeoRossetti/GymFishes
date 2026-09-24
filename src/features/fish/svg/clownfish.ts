import { tone } from './helpers'
import type { FishArt } from './types'

/** Peixe-palhaço — migrated from the M5 sticker; redrawn in a later task. */
export const clownfish: FishArt = {
  view: [64, 40],
  body: 'M16 20 C16 10 26 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C26 34 16 30 16 20 Z',
  tailPivot: [17, 20],
  tail: [{ d: 'M17 20 C12 12 8 12 4 14 C6 18 6 22 4 26 C8 28 12 28 17 20 Z', fill: tone('accent-orange') }],
  layers: [
    { d: 'M16 20 C16 10 26 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C26 34 16 30 16 20 Z', fill: tone('accent-orange') },
    { d: 'M28 8 L34 1 L42 7 Z', fill: tone('accent-orange') },
    { d: 'M28 32 L34 39 L42 33 Z', fill: tone('accent-orange') },
    { d: 'M25 9 C24 16 24 24 25 31 L29 31 C28 24 28 16 29 9 Z', fill: tone('ink') },
    { d: 'M41 7 C40 15 40 25 41 33 L45 33 C44 25 44 15 45 7 Z', fill: tone('ink') },
  ],
  eyes: [{ cx: 52, cy: 17, r: 2.4 }],
}
