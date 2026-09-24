import { tone } from './helpers'
import type { FishArt } from './types'

/** Tambaqui — migrated from the M5 angelfish sticker; redrawn in a later task (sequência de 100 dias). */
export const tambaqui: FishArt = {
  view: [64, 40],
  body: 'M20 20 C20 12 28 8 36 8 C46 8 54 14 58 20 C54 26 46 32 36 32 C28 32 20 28 20 20 Z',
  tailPivot: [21, 20],
  tail: [{ d: 'M21 20 L8 10 L11 20 L8 30 Z', fill: tone('accent-yellow') }],
  layers: [
    { d: 'M20 20 C20 12 28 8 36 8 C46 8 54 14 58 20 C54 26 46 32 36 32 C28 32 20 28 20 20 Z', fill: tone('ink-2') },
    { d: 'M26 10 C28 0 42 0 48 9 Z', fill: tone('accent-yellow') },
    { d: 'M26 30 C28 40 42 40 48 31 Z', fill: tone('accent-yellow') },
    { d: 'M31 9 L29 31 L33 31 L35 9 Z', fill: tone('ink') },
    { d: 'M43 9 L41 31 L45 31 L47 9 Z', fill: tone('ink') },
  ],
  eyes: [{ cx: 50, cy: 17, r: 2.4 }],
}
