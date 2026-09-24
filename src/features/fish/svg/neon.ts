import { part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const S = { base: '#C9D6E2', shade: '#8FA5B8', light: '#E4ECF3', line: '#4F6273', stripe: '#38C8FF', red: '#E5323F', redLo: '#B21E2B' }

const BODY = 'M40 50 C46 38 70 34 100 35 C124 36 142 42 150 50 C142 58 124 64 100 65 C70 66 46 62 40 50 Z'

/** Neon tetra — slim silver torpedo, electric blue stripe, red lower rear half, forked tail (spec M7 §9.2). */
export const neon: FishArt = {
  body: BODY,
  tailPivot: [42, 50],
  tail: [
    part('M42 47 C34 40 26 34 16 30 C20 38 24 44 30 50 C24 56 20 62 16 70 C26 66 34 60 42 53 Z', S.shade, S.line),
    rays([42, 50], [[18, 32], [26, 42], [26, 58], [18, 68]], S.line, 0.85, 0.8),
  ],
  layers: [
    part('M84 36 C88 27 96 25 104 27 C102 30 100 33 100 36 Z', S.shade, S.line, 0.8),
    rays([92, 36], [[89, 29], [95, 27], [101, 29]], S.line, 0.85, 0.7),
    part('M56 38 C58 34 62 33 65 36 Z', S.shade, S.line, 0.8),
    part('M64 63 C68 72 80 73 90 64 Z', S.shade, S.line, 0.8),
    rays([77, 64], [[68, 69], [76, 71], [84, 69]], S.line, 0.85, 0.7),
    part(BODY, S.base, S.line),
    ...scaleRows({ x0: 56, x1: 124, y0: 40, rows: 5, dy: 5, dx: 6, r: 2.4, color: () => S.shade, width: 0.5 }),
    shade('M40 50 C54 51.5 74 51 94 50.5 C100 54 102 60 99 66 C70 67 48 61 40 50 Z', S.red),
    shade('M42 53 C54 60 72 63 100 63 L100 68 L40 68 Z', S.redLo),
    shade('M46 49 C70 38.5 112 37.5 146 45.5 C112 45.5 76 47 46 49 Z', S.stripe),
    shade('M60 38 C84 34.5 116 35 140 42 C116 36.5 84 36.5 62 40 Z', S.light),
    shade('M126 40 C120 44 120 56 126 60 C124 56 124 44 126 40 Z', S.shade),
    stroke('M150 50 C147 49.4 144.5 49.2 142 49.4', S.line, 0.9),
  ],
  eyes: [{ cx: 136, cy: 46, r: 5 }],
}
