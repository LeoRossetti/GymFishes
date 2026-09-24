import { part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const D = { base: '#6F8FA8', shade: '#486A85', light: '#A9C1D3', line: '#14222E', belly: '#E4ECF2' }

const BODY = 'M11 52 C24 46 50 31 90 29 C116 28 132 33 140 39 C144 42 147 45 151 46.5 L157 48 C159.5 48.8 159.5 51.2 157 52 C151 53.5 146 56 140 58.5 C124 65 104 69 84 68 C56 66.5 32 60 11 52 Z'

/** Golfinho — bottlenose dolphin: sleek grey body, melon and short beak with the smile line, curved dorsal, flukes, light belly (spec M7 §9.2). */
export const dolphin: FishArt = {
  body: BODY,
  tailPivot: [16, 52],
  tail: [part('M20 50 C14 42 9 36 4 31 C7 40 10 46 12 52 C10 58 7 64 4 73 C9 68 14 62 20 54 Z', D.base, D.line)],
  layers: [
    part('M106 30 C100 20 92 14 82 11 C86 18 86 25 82 31 Z', D.base, D.line),
    part(BODY, D.base, D.line),
    shade('M14 53 C50 55 92 56 118 55 C134 54 146 51 158 49 L160 80 L14 80 Z', D.shade),
    shade('M158 51 C140 58 118 61 94 61 C70 61 50 60 34 62 L34 80 L158 80 Z', D.belly),
    shade('M40 44 C66 34 100 29.5 136 38 C104 33.5 70 37 42 47 Z', D.light),
    part('M124 59 C118 66 110 73 99 77 C102 70 106 63 111 58.5 C115 57 120 57 124 59 Z', D.shade, D.line),
    stroke('M158 50.5 C153 51.4 147 52 141 50.5', D.line, 1.1),
    stroke('M116 33 C118 32.2 120 32.2 122 33', D.line, 1.2),
  ],
  eyes: [{ cx: 134, cy: 45, r: 4.2 }],
}
