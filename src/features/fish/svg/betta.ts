import { part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const B = { base: '#2B5FC7', shade: '#173C8F', light: '#5A93EE', line: '#0E2358', scaleHi: '#3FB9C9', scaleLo: '#3A78D8' }
const F = { base: '#D8385A', shade: '#A5213F', light: '#F27C93', line: '#6E1530' }

const BODY = 'M140 50 C136 42 125 33 108 32.5 C92 32 74 38 60 46 C58 48 58 52 60 54 C74 62 92 68 108 67.5 C125 67 136 58 140 50 Z'

/** Betta — blue body, red veil tail, tall dorsal and a long anal fin (spec M7 §9.2). */
export const betta: FishArt = {
  body: BODY,
  tailPivot: [60, 50],
  tail: [
    part('M60 45 C50 36 32 32 16 38 C18 50 13 64 8 76 C15 88 34 92 48 80 C54 74 58 63 60 57 Z', F.base, F.line),
    rays([60, 50], [[17, 39], [15, 48], [12, 58], [9, 68], [10, 78], [17, 85], [27, 89], [38, 87], [48, 78]], F.shade, 0.9),
    stroke('M60 45 C51 38 36 36 24 40 C25 50 21 63 17 73 C23 82 36 85 46 77 C52 72 58 63 60 57 Z', F.light, 0.8),
  ],
  layers: [
    part('M106 34 C98 19 78 14 62 23 C55 27 53 36 57 45 C62 40 78 35 106 34 Z', F.base, F.line),
    rays([100, 34], [[64, 24], [58, 29], [55, 35], [55, 42]], F.shade, 0.9),
    part('M112 66 C100 84 78 93 60 88 C53 84 53 72 59 58 C68 63 86 67 112 66 Z', F.base, F.line),
    rays([108, 67], [[62, 87], [56, 80], [54, 72], [56, 63]], F.shade, 0.9),
    part('M119 63 C117 74 113 84 108 91 C110 83 113 72 117 63 Z', F.shade, F.line, 0.8),
    part('M116 64 C113 74 109 82 104 88 C107 81 110 71 113 63 Z', F.base, F.line, 0.8),
    part(BODY, B.base, B.line),
    shade('M60 52 C76 60 94 66 110 65 C122 64 131 60 138 54 L140 70 L58 70 Z', B.shade),
    shade('M66 42 C82 34 100 32 118 34.5 C104 35 88 37 70 45 Z', B.light),
    ...scaleRows({ x0: 66, x1: 132, y0: 37, rows: 7, dy: 5, dx: 6, r: 2.6, color: (row) => (row < 3 ? B.scaleHi : B.scaleLo), width: 0.7 }),
    part('M114 53 C107 56 105 62 109 66 C112 62 114 57 116 53 Z', F.light, F.line, 0.8),
    { ...stroke('M122 34 C115 42 115 58 122 66', B.line, 1), clip: true },
    stroke('M140 50 C137 49 135 48.6 133 48.8', B.line, 1),
  ],
  eyes: [{ cx: 129, cy: 45, r: 4.2 }],
}
