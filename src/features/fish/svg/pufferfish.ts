import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt } from './types'

const P = { base: '#C9D45A', shade: '#8E9A2E', light: '#E9F08E', line: '#5A6420', spots: '#3B4322', belly: '#F2F0D8' }

const BODY = 'M32 50 C32 30 52 18 82 18 C112 18 140 32 142 50 C140 68 112 82 82 82 C52 82 32 70 32 50 Z'

/** Baiacu — round inflated body, tiny fins, dark spots on the back, pale belly (spec M7 §9.2). */
export const pufferfish: FishArt = {
  body: BODY,
  tailPivot: [34, 50],
  tail: [
    part('M34 50 C26 42 18 40 12 42 C16 48 16 52 12 58 C18 60 26 58 34 50 Z', P.shade, P.line),
    rays([34, 50], [[13, 43], [12, 50], [13, 57]], P.line, 0.85, 0.8),
  ],
  layers: [
    part('M50 28 C52 17 60 14 68 22 Z', P.shade, P.line, 0.8),
    part('M50 72 C52 83 60 86 68 78 Z', P.shade, P.line, 0.8),
    part(BODY, P.base, P.line),
    shade('M32 55 C52 62 110 63 142 51 L142 90 L30 90 Z', P.shade),
    shade('M33 58.5 C54 67 110 68 141 54 L142 90 L30 90 Z', P.belly),
    shade('M50 30 C70 20 100 20 128 32 C104 24 74 24 52 34 Z', P.light),
    dots([[60, 33, 3], [76, 27, 3.4], [94, 26, 3], [107, 30, 2.6], [68, 44, 2.8], [86, 39, 3], [103, 42, 2.6], [50, 45, 2.2], [80, 51, 2.4], [96, 53, 2.2], [62, 54, 2]], P.spots, true),
    shade('M123 35 C116 42 116 58 123 65 C119.5 58 119.5 42 123 35 Z', P.shade),
    part('M119 51 C112 52 107 58 109 64 C113 63 117 59 120 55 Z', P.light, P.line, 0.8),
    stroke('M141 50 C138 48.5 136 48.5 134 50 C136 51.5 138 51.5 141 50', P.line, 1),
  ],
  eyes: [{ cx: 118, cy: 38, r: 7 }],
}
