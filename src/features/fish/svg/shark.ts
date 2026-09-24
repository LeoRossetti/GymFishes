import { part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const H = { base: '#7C8B99', shade: '#55636F', light: '#A7B4C0', line: '#161D23', belly: '#F0F3F5' }

const BODY = 'M13 50 C30 44 50 32 84 29 C114 27 138 34 153 44 C151 48 146 51 140 53 C124 62 104 67 84 66 C56 64 32 57 13 50 Z'

const GILLS = 'M112 41 C111 46 111 52 112 57 M116.5 40.5 C115.5 46 115.5 52 116.5 57.5 M121 40.5 C120 46 120 51.5 121 57 M125.5 41 C124.5 46 124.5 51 125.5 56 M130 42 C129 46 129 50 130 54'

/** Tubarão — torpedo body, pointed snout over a low mouth, tall dorsal, crescent tail, five gill slits, white belly (spec M7 §9.2). */
export const shark: FishArt = {
  body: BODY,
  tailPivot: [18, 50],
  tail: [part('M24 47 C18 38 12 26 7 13 C11 26 12 38 12 48 C10 56 8 62 6 71 C12 65 18 58 24 53 Z', H.base, H.line)],
  layers: [
    part('M104 29 C98 18 90 9 80 4 C82 12 82 22 76 30 Z', H.base, H.line),
    part('M44 38.5 C42 34 40 32 36 31 C37 34 36 38 34 41 Z', H.base, H.line, 1.2),
    part(BODY, H.base, H.line),
    shade('M10 50 C40 52 80 54 110 53 C130 52 142 49 153 45 L160 80 L10 80 Z', H.shade),
    shade('M151 47 C136 54 112 59.5 90 60 C66 60 44 58 24 55 L24 80 L150 80 Z', H.belly),
    shade('M40 41 C66 32 100 28 138 35 C104 32 70 35 42 44 Z', H.light),
    { ...stroke(GILLS, H.line, 1), clip: true },
    part('M118 58 C112 68 104 78 94 84 C96 76 100 66 106 58 C110 56 114 56 118 58 Z', H.shade, H.line),
    stroke('M147.5 48 C143.5 51.5 137 53.5 130 53.5 C128.5 53.5 127.5 53 127 52.5', H.line, 1.2),
  ],
  eyes: [{ cx: 140, cy: 40.5, r: 4 }],
}
