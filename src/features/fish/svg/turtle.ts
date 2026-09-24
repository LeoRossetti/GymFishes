import { dots, part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const K = { shell: '#4E8F3A', shade: '#2F6423', light: '#8AC46F', line: '#1F4417', skin: '#8FA066', skinShade: '#5F6E42' }

const BODY = 'M26 54 C28 28 58 14 90 14 C118 14 136 28 138 48 C138 57 130 62 118 62 L44 62 C32 62 26 60 26 54 Z'

const SEAMS = 'M34 42 C50 30 70 26 90 26 C110 26 126 32 134 42 M62 29 L60 17 M90 26 L90 12 M117 30 L119 18 M52 33 L50 50 M76 27 L74 50 M103 27 L105 50 M124 35 L127 48'
const MARGIN = 'M38 55 L37 64 M50 56 L49 64 M62 57 L61 64 M74 57 L74 64 M86 57 L86 64 M98 57 L98 64 M110 56 L111 64 M122 55 L123 64 M132 52 L134 60'

/** Tartaruga — sea turtle swimming right: domed shell with plates and a light rim, beaked head, long front flipper (spec M7 §9.2). */
export const turtle: FishArt = {
  body: BODY,
  tailPivot: [46, 60],
  tail: [
    part('M31 56 C25 57 20 58 17 57 C20 54 25 53 31 53 Z', K.skin, K.skinShade, 1),
    part('M52 59 C46 68 36 74 25 72 C22 70 26 66 32 64 C38 62 45 60 52 59 Z', K.skin, K.skinShade, 1.4),
    stroke('M48 62 C42 66 36 69 30 70', K.skinShade, 1),
  ],
  layers: [
    part('M128 52 C134 44 142 40 149 40 C155 40 158.5 44 158.5 48.5 C158.5 53 155.5 55.5 151 56.5 C145 58 138 58.5 130 60 Z', K.skin, K.skinShade, 1.4),
    dots([[142, 45, 1.3], [152, 43, 1.1], [141, 52.5, 1.2]], K.skinShade),
    stroke('M158.5 49.5 C156 51.5 153 52.5 149.5 52.5', K.skinShade, 1.2),
    part('M124 54 C132 66 120 80 100 88 C93 91 89 87 93 82 C100 76 106 68 108 56 Z', K.skin, K.skinShade, 1.4),
    stroke('M119 64 C114 74 106 80 97 84', K.skinShade, 1),
    dots([[114, 68, 1.2], [107, 76, 1]], K.skinShade),
    part(BODY, K.shell, K.line),
    shade('M20 45 C50 53 110 53 142 43 L142 70 L20 70 Z', K.shade),
    shade('M20 55 C50 60 110 60 142 51 L142 70 L20 70 Z', K.light),
    shade('M42 32 C58 20 82 15 108 18 C84 18 62 23 46 35 Z', K.light),
    { ...stroke(SEAMS, K.shade, 1.2), clip: true },
    { ...stroke(MARGIN, K.shade, 1), clip: true },
  ],
  eyes: [{ cx: 148, cy: 46, r: 3.8 }],
}
