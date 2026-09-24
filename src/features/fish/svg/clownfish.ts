import { part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const C = { base: '#FF7A1A', shade: '#D95A00', light: '#FFA25C', line: '#7A2E00', band: '#F7F7F2', edge: '#1C1C1C' }

const BODY = 'M40 50 C44 30 70 24 98 25 C124 26 142 38 150 50 C142 62 124 74 98 75 C70 76 44 70 40 50 Z'

/** Peixe-palhaço — orange oval, three black-edged white bands, black-rimmed rounded fins (spec M7 §9.2). */
export const clownfish: FishArt = {
  body: BODY,
  tailPivot: [42, 50],
  tail: [
    part('M42 50 C36 38 28 34 20 36 C24 44 24 56 20 64 C28 66 36 62 42 50 Z', C.base, C.edge, 1.4),
    rays([42, 50], [[22, 38], [21, 50], [22, 62]], C.shade, 0.85, 0.8),
  ],
  layers: [
    part('M64 33 C62 22 70 13 82 14 C89 15 92 20 94 24 C98 18 107 18 113 23 C116 25 118 28 118 31 Z', C.base, C.edge, 1.4),
    rays([80, 30], [[68, 20], [76, 16], [86, 17]], C.shade, 0.85, 0.8),
    rays([106, 30], [[100, 22], [108, 21]], C.shade, 0.8, 0.8),
    part('M74 73 C80 86 96 88 108 74 Z', C.base, C.edge, 1.4),
    part(BODY, C.base, C.line),
    shade('M42 54 C70 72 120 74 148 54 C130 74 78 78 44 58 Z', C.shade),
    shade('M60 32 C86 24 118 26 140 40 C118 30 86 30 62 36 Z', C.light),
    shade('M116 26 C112 42 112 58 116 74 L128 74 C124 58 124 42 128 26 Z', C.band),
    { ...stroke('M116 26 C112 42 112 58 116 74 M128 26 C124 42 124 58 128 74', C.edge, 1.6), clip: true },
    shade('M78 25 C72 40 72 60 78 75 L90 75 C92 62 100 55 100 50 C100 45 92 38 90 25 Z', C.band),
    { ...stroke('M78 25 C72 40 72 60 78 75 M90 25 C92 38 100 45 100 50 C100 55 92 62 90 75', C.edge, 1.6), clip: true },
    shade('M46 38 C44 46 44 54 46 62 L54 64 C52 56 52 44 54 36 Z', C.band),
    { ...stroke('M46 38 C44 46 44 54 46 62 M54 36 C52 44 52 56 54 64', C.edge, 1.6), clip: true },
    part('M115 56 C107 55 101 61 102 67 C104 71 111 67 117 60 Z', C.base, C.edge, 1.2),
    stroke('M150 50 C146 49 143 49 140 50', C.line, 1),
  ],
  eyes: [{ cx: 132, cy: 42, r: 5.5 }],
}
