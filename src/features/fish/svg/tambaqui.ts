import { dots, part, rays, scaleRows, shade, stroke } from './helpers'
import type { FishArt } from './types'

const T = {
  back: '#7E8C42',
  shade: '#566229',
  light: '#AEB868',
  dark: '#2A2F2A',
  deep: '#171B18',
  cheek: '#CFBE94',
  gold: '#D6A83C',
  fin: '#3B4335',
  finRay: '#1B201C',
  line: '#141815',
}

/** Traced from the photos: 1.8 long to deep, hump ahead of the dorsal, convex forehead, the lips and mouth notch cut into the snout, jaw sloping back to the throat, narrow peduncle. */
const BODY = 'M37 38 C48 24 70 18 102 17 C124 18 148 30 155.5 49 C156.5 51 155.5 52 152.5 52.5 C155.5 53 157 54 156.5 56 C155.5 60 151 63 146 66 C136 74 128 78 118 80 C100 84 72 82 56 70 C48 65 41 61 37 55 Z'

/**
 * Tambaqui — the one fish drawn off the shared cartoon face (Leo, 2026-09-24): a real head with the big
 * rounded gill cover, pale cheek and throat, golden-ringed eye near the snout, nostril, thick lips cut into the
 * outline with the lower one jutting, and the jaw line. Olive back over a black lower half with a blotchy edge, swept dorsal,
 * adipose fin, forked tail (spec M7 §9.2).
 */
export const tambaqui: FishArt = {
  body: BODY,
  tailPivot: [39, 50],
  tail: [
    part('M39 41 C31 33 20 24 6 16 C11 31 18 42 23 50 C18 58 11 69 6 84 C20 75 31 65 39 57 Z', T.fin, T.line),
    rays([39, 50], [[8, 19], [15, 33], [22, 46], [22, 54], [15, 67], [8, 81]], T.finRay, 0.85),
  ],
  layers: [
    part('M88 18 C82 12 72 6 60 5 C58 12 56 19 52 26 C64 20 76 17 88 18 Z', T.fin, T.line),
    rays([86, 18], [[62, 6], [59, 11], [56, 17], [53, 23]], T.finRay, 0.8),
    part('M40 36 C40 25 47 24 50 29 Z', T.fin, T.line, 0.8),
    part('M80 81 C77 85 75 89 72 93 C60 84 50 72 42 60 C54 72 66 78 80 81 Z', T.fin, T.line),
    rays([78, 80], [[72, 92], [64, 88], [56, 80], [48, 70]], T.finRay, 0.8),
    part('M104 80 C100 84 96 88 92 91 C98 91 104 88 108 82 Z', T.fin, T.line, 0.8),
    part(BODY, T.back, T.line),
    // body: highlight ridge, scales up to the gill cover, the black lower half, its blotchy edge, the deep belly
    shade('M54 30 C84 16 122 17 146 36 C122 26 86 27 58 34 Z', T.light),
    ...scaleRows({ x0: 42, x1: 122, y0: 20, rows: 9, dy: 5, dx: 5.5, r: 2.2, color: () => T.shade, width: 0.6 }),
    shade('M34 47 C50 46 62 52 78 53 C92 54 100 60 110 62 C116 64 120 70 122 80 L122 92 L34 92 Z', T.dark),
    dots([[47, 44.5, 1.8], [56, 46.5, 2.4], [69, 49.5, 2], [87, 52, 2.4], [96, 55, 2], [106, 58.8, 2.2]], T.dark, true),
    shade('M36 56 C64 76 100 82 122 72 L122 92 L34 92 Z', T.deep),
    // head: dark crown, pale cheek and throat, the gill-cover arc, the jaw line
    shade('M116 18 C136 19 150 28 155 48 C150 34 138 24 116 22 Z', T.shade),
    shade('M158 52.5 C154 53 150 53.6 146 54.5 C136 56.5 127 60 121 64 C119 72 120 82 122 90 L160 90 Z', T.cheek),
    stroke('M126 25 C116 37 116 63 127 75', T.shade, 1.2),
    stroke('M148 55 C145 60 140 65 133 70', T.shade, 0.7),
    part('M124 62 C116 64 110 70 108 76 C114 75 120 70 126 65 Z', T.fin, T.line, 0.8),
    // mouth: the cleft running back from the notch (upper lip stays olive, lower lip is the pale jaw); nostril; golden iris ring under the eye
    stroke('M152.5 52.5 C151 53 149.5 53.3 147.5 53.5', T.line, 1.2),
    dots([[149, 43, 0.9]], T.line),
    part('M138.8 47 A5.2 5.2 0 1 0 149.2 47 A5.2 5.2 0 1 0 138.8 47 Z', T.gold),
  ],
  eyes: [{ cx: 144, cy: 47, r: 4.2 }],
}
