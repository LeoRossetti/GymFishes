import { tone } from './helpers'
import type { FishArt } from './types'

/** Baleia — migrated from the M5 sticker; redrawn in a later task. */
export const whale: FishArt = {
  view: [64, 40],
  body: 'M8 22 C8 10 22 6 38 6 C52 6 62 14 62 22 C62 28 56 32 46 32 L20 32 C12 32 8 28 8 22 Z',
  tailPivot: [9, 22],
  tail: [{ d: 'M9 22 C4 14 0 14 0 18 C2 20 2 24 0 28 C4 30 8 28 9 22 Z', fill: tone('accent-blue') }],
  layers: [
    { d: 'M8 22 C8 10 22 6 38 6 C52 6 62 14 62 22 C62 28 56 32 46 32 L20 32 C12 32 8 28 8 22 Z', fill: tone('accent-blue') },
    { d: 'M28 30 L24 38 L36 32 Z', fill: tone('accent-blue') },
    { d: 'M20 28 C30 34 48 32 58 26 L56 29 C46 36 28 36 20 31 Z', fill: tone('ink-2') },
  ],
  eyes: [{ cx: 52, cy: 18, r: 2.4 }],
}
