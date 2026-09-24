import { dots, part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const W = { base: '#4C7DA6', shade: '#2F5A7E', light: '#7EA8CC', line: '#0B1C2B', belly: '#D6E3EE' }

const BODY = 'M10 50 C24 45 50 36 90 34 C122 33 144 36.5 152.5 42.5 C156 45 157.5 48 155.5 51 C150 58 136 64 116 66 C84 68 50 64 30 58 C22 55.5 16 53 10 50 Z'

const GROOVES = 'M150 55 C136 58 118 60 96 61 M146 58 C132 61 116 63 96 64 M140 61 C128 63.5 114 65 98 66.5'

/** Baleia — blue whale: very long flat body, tiny dorsal far back, wide flukes, long mouth line over a grooved throat (spec M7 §9.2). */
export const whale: FishArt = {
  body: BODY,
  tailPivot: [12, 50],
  tail: [part('M17 47 C14 40 10 33 5 28 C4 36 6 44 10 50 C6 56 4 64 5 72 C10 67 14 60 17 53 Z', W.base, W.line)],
  layers: [
    part('M40 42 C38 38 36 36 32 35 C33 38 32 41 30 44 Z', W.base, W.line, 1.2),
    part(BODY, W.base, W.line),
    shade('M8 50 C40 52 80 53 120 53 C136 52 148 51 158 49 L160 80 L8 80 Z', W.shade),
    shade('M158 50 C146 51 132 52.5 120 54 C100 58 70 61 30 58 L30 80 L160 80 Z', W.belly),
    { ...stroke(GROOVES, W.light, 0.9), clip: true },
    shade('M34 45 C66 36 110 33 146 39 C110 36 70 39 36 48 Z', W.light),
    dots([[58, 45, 1.4], [72, 42.5, 1.1], [86, 46, 1.3], [100, 41.5, 1.1], [48, 49, 1.1], [112, 45, 1]], W.light, true),
    part('M122 62 C118 68 112 72 104 74 C106 70 109 65 112 62 C115 60.5 119 60.5 122 62 Z', W.shade, W.line),
    stroke('M155.5 50 C146 51 134 52.5 122 54 C119 54.4 117 54 115.5 53', W.line, 1.2),
    dots([[136, 38.5, 1.3]], W.line),
  ],
  eyes: [{ cx: 120, cy: 48.5, r: 3.6 }],
}
