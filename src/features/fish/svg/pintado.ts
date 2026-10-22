import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const P = {
  back: '#7B7D6B',
  shade: '#5B5D4C',
  light: '#9EA08C',
  belly: '#E4E0D1',
  bellyShade: '#C7C2B0',
  cheek: '#CFC9B8',
  spot: '#2A2B24',
  bar: '#B7B6A2',
  fin: '#A29C8A',
  finRay: '#6E6959',
  barbel: '#D9D1BC',
  ring: '#B8A878',
  line: '#20211C',
}

/** Traced from a lateral photo: about 5:1 long to deep (the real fish is thinner still), long spatulate head a third of the body, small high eye, tall dorsal, long adipose, forked spotted tail. */
const BODY = 'M33 46.5 C48 43.5 68 39.5 90 38 C106 37 120 37.5 132 40 C143 42.5 151 46.2 155.8 49.6 C158.4 51.4 158.6 54 156.6 55.2 L154.4 55.6 C155.2 56.2 155 57.4 153.6 57.8 C148.6 58.8 143.4 59 138 59.4 C128 60.5 118 62.5 108 63.8 C92 65.5 72 64.6 58 61.6 C48 59.6 40 58 33 56.5 C30.8 53.4 30.8 49.6 33 46.5 Z'

/** A barbel: a dark under-stroke for the outline, the pale whisker on top. */
function barbel(d: string): Layer[] {
  return [stroke(d, P.line, 2), stroke(d, P.barbel, 0.9)]
}

// The round spots of the upper flank, in loose rows that thin toward the belly.
const FLANK_SPOTS: [number, number, number][] = [
  [42, 47.5, 1.1], [47, 45.2, 1.2], [53, 44.2, 1.4], [59, 42.6, 1.3], [66, 41.6, 1.5], [73, 40.6, 1.3], [80, 40.2, 1.5],
  [88, 39.8, 1.3], [96, 39.6, 1.4], [104, 40, 1.2],
  [45, 50.5, 1.3], [51, 48.6, 1.5], [57, 47.4, 1.2], [63, 46, 1.6], [70, 45.2, 1.3], [77, 44.4, 1.6], [85, 44, 1.3],
  [92, 43.6, 1.6], [100, 44, 1.3],
  [55, 52, 1.4], [61, 50.6, 1.2], [68, 49.6, 1.5], [75, 48.8, 1.2], [82, 48.6, 1.5], [90, 48.2, 1.2], [97, 48.6, 1.4],
  [66, 54.4, 1.3], [79, 53.4, 1.4], [93, 53, 1.2],
  [72, 58.2, 1], [88, 58.6, 1.1],
]

/**
 * Pintado (surubim) — the spotted catfish of the Pantanal and the Paraná. Grey back with round black
 * spots and the thin pale bars, white belly, long flat head with the small eye on top, two long
 * whiskers from the corners of the mouth and two short ones under the chin.
 */
export const pintado: FishArt = {
  body: BODY,
  tailPivot: [34, 51.5],
  tail: [
    part('M38 47 C29 43.6 18 37 8 29 C5 27 3 28.5 4 31.5 C8 39 14 46 20 51.5 C14 57 8 64 5 70 C4 73 6.5 74.5 9 72.5 C18 66 29 59.4 38 56 Z', P.fin, P.line),
    rays([36, 51.5], [[6, 31], [11, 38], [17, 46], [17, 57], [11, 65], [7, 71]], P.finRay, 0.85),
    dots([[12, 35, 1], [17, 40, 1.1], [24, 44, 1], [28, 47.5, 0.9], [12, 67, 1], [17, 62, 1.1], [24, 58, 1], [9, 31.5, 0.8]], P.spot),
  ],
  layers: [
    // dorsal: tall, leaning back, spotted
    part('M95 38.6 C93.4 30 91 21.6 88.2 15.6 C87.2 13.6 85.2 13.4 84.2 15.2 C82.6 18.6 81.6 23.4 80.8 28.4 C80.2 32.4 78.8 36.4 76.6 39.8 Z', P.fin, P.line),
    rays([84, 39], [[86, 15.5], [84.6, 18], [83, 23], [81, 29], [78.6, 34.5]], P.finRay, 0.88),
    dots([[86.5, 24, 0.9], [84, 30, 0.9], [88.5, 31.5, 0.8], [81.5, 35.5, 0.8]], P.spot),
    // adipose, anal, pelvic
    part('M63 42.2 C58 38.5 50 37 44 40.5 C41.5 42 40.5 43.8 40.8 45.2 Z', P.fin, P.line, 1.2),
    dots([[54, 40.6, 0.8], [48, 41, 0.8]], P.spot),
    part('M57 61.2 C55.5 65 52.5 68.5 48 70.5 C46.6 71 46 69.8 46.6 68.6 C47.4 66 47.6 62.5 46.5 59.6 Z', P.fin, P.line, 1.2),
    part('M80 64.6 C76.5 68.8 72 71.4 66 72.4 C64.5 72.6 64.2 71.2 65.2 70.2 C67.8 67.6 69.6 65.2 70.4 63.3 Z', P.fin, P.line, 1.2),
    part(BODY, P.back, P.line),
    // body: back highlight, white belly with an uneven edge, the pale bars, the spots
    shade('M44 45 C64 40 90 37.5 120 38.5 C100 40 70 42.5 46 47.2 Z', P.light),
    shade('M30 55.6 C40 56.8 48 55.4 56 56.6 C64 57.8 70 56 78 56.8 C86 57.6 92 55.8 100 56.6 C110 57.6 118 56.4 128 57.4 C138 58.2 148 57.6 160 57 L160 92 L30 92 Z', P.belly),
    shade('M30 60 C60 64 92 66.5 118 64 L118 92 L30 92 Z', P.bellyShade),
    shade(
      ([
        [47, 44.6, 8],
        [57.4, 42.6, 10],
        [68.6, 41, 7],
        [76.4, 40, 11],
        [86.4, 38.8, 8],
        [95.6, 38.6, 10],
        [104.4, 38.8, 7],
      ] as [number, number, number][])
        .map(([x, top, len]) => `M${x} ${top} L${x + 1.1} ${top} L${x + 1.7} ${top + len} L${x + 0.6} ${top + len} Z`)
        .join(' '),
      P.bar,
    ),
    dots(FLANK_SPOTS, P.spot, true),
    // head: pale lower head, the long gill cover, spots on the crown
    shade('M106 57.6 C118 57.2 130 57.4 141.6 57.2 C146 57 150 56.4 154.4 55.6 L160 55 L160 92 L106 92 Z', P.cheek),
    stroke('M110 39.4 C103.5 46 103.6 56 109 63.4', P.shade, 1.3),
    dots([[114, 41, 0.8], [120, 40.4, 0.7], [125, 42, 0.7], [118, 45, 0.8], [112, 48, 0.7], [122, 47.5, 0.6]], P.spot, true),
    part('M111 60.2 C104 63.6 96 68.4 87.4 72.6 C85.8 73.4 85.4 71.8 86.6 70.8 C91.4 66.8 96 63.4 99.4 61.6 C103 60.4 107 59.8 111 60.2 Z', P.fin, P.line, 1.2),
    // mouth, nostrils, the iris ring
    stroke('M154.4 55.6 C150 56.4 145.6 57 141.6 57.2', P.line, 1.1),
    dots([[150.6, 47.6, 0.7], [147, 45.8, 0.7]], P.line),
    part('M130 44.6 A3 3 0 1 0 136 44.6 A3 3 0 1 0 130 44.6 Z', P.ring),
    // whiskers: two long from the mouth corners, two short under the chin
    ...barbel('M144.6 57.4 C146 67 144.6 78 139.6 88'),
    ...barbel('M141.6 57.4 C140.4 66 135.6 76 126 85'),
    ...barbel('M151.6 58.2 C152 61 151.2 63.6 149.4 66'),
    ...barbel('M148.4 58.6 C148.2 61.6 147 64.4 144.8 66.8'),
  ],
  eyes: [{ cx: 133, cy: 44.6, r: 2.3 }],
}
