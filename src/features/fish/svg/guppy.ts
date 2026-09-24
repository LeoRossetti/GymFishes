import { dots, part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const A = { base: '#22B8F0', shade: '#1793CC', light: '#8ADCFF', line: '#0E6E9E' }
const O = { base: '#FF9600', shade: '#D96E00', light: '#FFC27A', line: '#B35A00' }

const BODY = 'M58 49 C68 40 84 34 104 33 C124 32 139 39 147 47 C141 58 126 67 106 68 C84 69 68 60 58 51 Z'

/** Guppy — slim aqua body, huge spotted orange fan tail (spec M7 §9.2). */
export const guppy: FishArt = {
  body: BODY,
  tailPivot: [62, 50],
  tail: [
    part('M62 46 C48 34 32 22 18 15 C13 13 10 15 8 20 C3 34 3 66 8 80 C10 85 13 87 18 85 C32 78 48 66 62 54 Z', O.base, O.line),
    rays([62, 50], [[15, 16], [8, 28], [5, 43], [5, 57], [8, 72], [15, 84]], O.shade, 0.9),
    stroke('M13 22 C8 34 8 66 13 78', O.light, 1.2),
    dots([[24, 28, 2.6], [17, 42, 3], [17, 58, 3], [24, 72, 2.6], [34, 36, 2.2], [29, 50, 2.4], [34, 64, 2.2], [44, 44, 1.7], [44, 56, 1.7]], O.shade),
  ],
  layers: [
    part('M98 34 C94 26 84 20 66 21 C63 26 66 34 72 40 Z', O.base, O.line),
    rays([96, 34], [[68, 22], [65, 28], [68, 35]], O.shade, 0.9),
    part('M86 66 C84 74 78 78 72 78 C74 72 78 67 80 64 Z', O.shade, O.line, 1.2),
    part(BODY, A.base, A.line),
    shade('M58 51 C70 60 88 66 108 66 C124 66 136 60 145 52 L150 72 L56 72 Z', A.shade),
    shade('M86 63 C102 66 122 64 141 55 C131 65 117 69 103 69 C95 68 90 66 86 63 Z', A.light),
    shade('M70 42 C86 35 110 33 132 38 C112 36 92 37 74 45 Z', A.light),
    ...scaleRows({ x0: 68, x1: 128, y0: 38, rows: 5, dy: 6, dx: 7, r: 3, color: () => A.shade, width: 0.6 }),
    shade('M124 35 C118 42 118 58 124 65 C121 58 121 42 124 35 Z', A.shade),
    part('M120 54 C113 56 111 61 114 65 C117 62 119 58 122 54 Z', A.light, A.line, 0.8),
    stroke('M147 47 C143 47 140 47.5 138 48.5', A.line, 1),
  ],
  eyes: [{ cx: 133, cy: 44, r: 5 }],
}
