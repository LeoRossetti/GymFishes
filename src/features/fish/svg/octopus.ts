import type { FishArt } from './types'

/** Polvo — purple dome, four tentacles (the left one wags as the "tail"), pink suckers (um dia acima de 5 L). */
export const octopus: FishArt = {
  body: 'M16 18 C16 4 48 4 48 18 C48 24 42 28 32 28 C22 28 16 24 16 18 Z',
  tail: 'M20 26 C14 30 10 36 14 39 C16 34 20 30 24 27 Z',
  tailPivot: [21, 26],
  fins: [
    'M26 27 C24 32 22 38 28 39 C28 34 30 30 31 27 Z',
    'M33 27 C34 30 36 34 36 39 C42 38 40 32 38 27 Z',
    'M40 27 C44 30 50 36 50 39 C54 36 48 30 44 26 Z',
  ],
  marks: [
    'M15 36a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M27 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M37 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M48 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
  ],
  eyes: [
    [26, 16],
    [38, 16],
  ],
  colors: { body: 'accent-purple', tail: 'accent-purple', fins: 'accent-purple', marks: 'accent-pink' },
}
