import { part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const G = { base: '#FF9600', shade: '#D96E00', light: '#FFD27A', belly: '#FFE9B8', line: '#B35A00' }

const BODY = 'M50 50 C54 26 78 16 102 18 C126 20 142 36 148 50 C142 64 126 80 102 82 C78 84 54 74 50 50 Z'

/** Peixe-dourado — deep round orange body, double flowing tail, tall soft dorsal (spec M7 §9.2). */
export const goldfish: FishArt = {
  body: BODY,
  tailPivot: [52, 50],
  tail: [
    part('M52 44 C44 30 28 14 10 14 C14 24 20 36 30 48 C27 50 27 50 30 52 C20 64 14 76 10 86 C28 86 44 70 52 56 Z', G.base, G.line),
    rays([52, 50], [[12, 16], [16, 26], [23, 38], [23, 62], [16, 74], [12, 84]], G.shade, 0.9),
    part('M52 46 C46 38 36 32 24 30 C28 38 32 44 38 49 C35 50 35 50 38 51 C32 56 28 62 24 70 C36 68 46 62 52 54 Z', G.light, G.line, 1.2),
    rays([52, 50], [[26, 32], [34, 45], [34, 55], [26, 68]], G.shade, 0.85, 0.8),
  ],
  layers: [
    part('M114 20 C112 12 108 6 102 4 C92 8 80 16 70 27 C84 22 100 19 114 20 Z', G.base, G.line),
    rays([100, 22], [[102, 6], [94, 8], [84, 14], [76, 22]], G.shade, 0.85),
    part('M64 70 C64 84 74 92 86 88 C78 84 70 78 64 70 Z', G.shade, G.line),
    rays([72, 78], [[66, 82], [72, 88], [82, 89]], G.line, 0.8, 0.8),
    part('M112 78 C110 88 104 93 96 93 C100 88 103 83 105 79 Z', G.shade, G.line, 1.2),
    part(BODY, G.base, G.line),
    shade('M52 52 C66 66 96 74 124 68 C136 64 144 57 148 51 L150 90 L50 90 Z', G.shade),
    shade('M60 64 C76 80 118 82 142 60 C128 80 100 86 82 82 C70 79 64 72 60 64 Z', G.belly),
    shade('M72 28 C92 20 118 22 136 36 C118 26 94 26 74 34 Z', G.light),
    ...scaleRows({ x0: 60, x1: 132, y0: 30, rows: 8, dy: 6, dx: 7, r: 3, color: () => G.shade, width: 0.6 }),
    shade('M120 30 C114 38 114 62 120 70 C118 62 118 38 120 30 Z', G.shade),
    part('M112 60 C104 66 104 74 110 76 C114 70 116 64 118 60 Z', G.light, G.line, 0.8),
    stroke('M148 50 C144 49 141 49 138 50', G.line),
  ],
  eyes: [{ cx: 131, cy: 42, r: 5.5 }],
}
