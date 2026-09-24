import { tone } from './helpers'
import type { FishArt } from './types'

/** Cavalo-marinho — migrated from the M5 sticker; redrawn in a later task. */
export const seahorse: FishArt = {
  view: [64, 40],
  body: 'M36 6 C44 6 48 12 46 18 C44 22 40 24 38 26 L38 32 C38 36 34 40 28 38 C33 37 34 34 34 30 L34 26 C28 24 24 18 26 12 C28 8 32 6 36 6 Z',
  tailPivot: [30, 37],
  tail: [{ d: 'M30 37 C26 40 20 36 24 32 C26 34 28 36 30 37 Z', fill: tone('accent-yellow') }],
  layers: [
    {
      d: 'M36 6 C44 6 48 12 46 18 C44 22 40 24 38 26 L38 32 C38 36 34 40 28 38 C33 37 34 34 34 30 L34 26 C28 24 24 18 26 12 C28 8 32 6 36 6 Z',
      fill: tone('accent-yellow'),
    },
    { d: 'M46 14 L58 16 L46 19 Z', fill: tone('accent-orange') },
    { d: 'M26 14 C18 12 16 22 26 22 Z', fill: tone('accent-orange') },
  ],
  eyes: [{ cx: 39, cy: 13, r: 2.4 }],
}
