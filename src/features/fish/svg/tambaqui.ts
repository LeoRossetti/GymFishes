import { part, rays, scaleRows, shade } from './helpers'
import type { FishArt } from './types'

const T = { back: '#95AEBA', shade: '#5F7683', light: '#B7CBD4', low: '#475D67', deep: '#34474F', fin: '#5A7382', finRay: '#34474F', pec: '#6A8594', line: '#1B262C' }

const BODY = 'M35 50 C35 22.5 65 11 95 14 C125 16 145 32.5 152.5 50 C145 67.5 125 84 95 86 C65 89 35 77.5 35 50 Z'

/** Tambaqui — deep rounded body, small head, olive-silver back over a dark lower half, forked tail (spec M7 §9.2). */
export const tambaqui: FishArt = {
  body: BODY,
  tailPivot: [37.5, 50],
  tail: [
    part('M37.5 50 C30 38 20 26 7 17 C11 30 18 42 26 50 C18 58 11 70 7 83 C20 74 30 62 37.5 50 Z', T.fin, T.line),
    rays([37.5, 50], [[10, 21], [20, 40], [20, 60], [10, 79]], T.finRay, 0.85),
  ],
  layers: [
    part('M70 17.5 C80 1 100 0 115 14 C100 11 82.5 12.5 70 17.5 Z', T.fin, T.line),
    rays([90, 16], [[82, 5], [98, 2]], T.finRay, 0.7),
    part('M75 85 C85 99 105 99 117.5 86 C105 90 87.5 90 75 85 Z', T.fin, T.line),
    rays([95, 87], [[86, 95], [104, 96]], T.finRay, 0.7),
    part('M46 30 C43 21 48 16 56 22 Z', T.fin, T.line, 0.8),
    part(BODY, T.back, T.line),
    shade('M34 50 C60 46 95 56 154 50 L154 92 L34 92 Z', T.low),
    shade('M34 60 C66 78 112 80 150 58 L150 92 L34 92 Z', T.deep),
    shade('M56 26 C80 14 110 16 134 30 C110 20 80 22 60 32 Z', T.light),
    ...scaleRows({ x0: 42, x1: 138, y0: 22, rows: 6, dy: 5, dx: 6, r: 2.6, color: () => T.shade, width: 0.6 }),
    shade('M128 30 C122 38 122 62 128 70 C126 62 126 38 128 30 Z', T.shade),
    part('M119 58 C111 59 104 65 104 72 C111 72 117 66 121 61 Z', T.pec, T.line, 0.8),
    part('M149 49.5 L154.5 50.5 L149.5 54 Z', T.line),
  ],
  eyes: [{ cx: 135, cy: 39, r: 7.5 }],
}
