import { tone } from './helpers'
import type { FishArt } from './types'

/** Polvo — migrated from the M5 sticker; redrawn in a later task. */
export const octopus: FishArt = {
  view: [64, 40],
  body: 'M16 18 C16 4 48 4 48 18 C48 24 42 28 32 28 C22 28 16 24 16 18 Z',
  tailPivot: [21, 26],
  tail: [{ d: 'M20 26 C14 30 10 36 14 39 C16 34 20 30 24 27 Z', fill: tone('accent-purple') }],
  layers: [
    { d: 'M16 18 C16 4 48 4 48 18 C48 24 42 28 32 28 C22 28 16 24 16 18 Z', fill: tone('accent-purple') },
    { d: 'M26 27 C24 32 22 38 28 39 C28 34 30 30 31 27 Z', fill: tone('accent-purple') },
    { d: 'M33 27 C34 30 36 34 36 39 C42 38 40 32 38 27 Z', fill: tone('accent-purple') },
    { d: 'M40 27 C44 30 50 36 50 39 C54 36 48 30 44 26 Z', fill: tone('accent-purple') },
    { d: 'M15 36a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z', fill: tone('accent-pink') },
    { d: 'M27 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z', fill: tone('accent-pink') },
    { d: 'M37 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z', fill: tone('accent-pink') },
    { d: 'M48 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z', fill: tone('accent-pink') },
  ],
  eyes: [
    { cx: 26, cy: 16, r: 2.4 },
    { cx: 38, cy: 16, r: 2.4 },
  ],
}
