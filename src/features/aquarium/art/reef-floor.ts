// The reef floor, ported from the approved art reference (reef.mjs): the sand, the reef rock, the brain,
// finger and staghorn corals, the sea fan, the anemone, the shells, the urchin and the starfish. Every
// coordinate and tone is the reference's; `R` is the reef palette.
import { piece, r2, ribbonPath, wob, type IdSpace, type Pt, type Seg } from './prims'
import type { ReefPalette } from './reef'

export function sand(ids: IdSpace, R: ReefPalette) {
  const c = R.sand
  const top = 'M0 199 C16 196 34 198.4 52 197.6 C70 196.8 88 199.6 106 199 C124 198.4 140 196.6 156 198'
  return piece(ids, {
    body: `${top} L156 216 L0 216 Z`, fill: c.base,
    shades: [
      ['M0 209 C30 207 60 210 90 209 C120 208 140 210 156 209 L156 216 L0 216 Z', c.shade],
      ['M0 199 C16 196 34 198.4 52 197.6 C34 199.8 16 199.6 0 201.6 Z', c.light],
      ['M70 203 C78 202.4 86 203.4 94 203 C86 204.2 78 204 70 204.4 Z', c.light],
    ],
    strokes: [[top, c.line, 0.8], ['M24 205 C28 204.4 32 204.6 36 205.2', c.shade, 0.6], ['M112 206 C117 205.2 122 205.4 127 206', c.shade, 0.6]],
  }) + [[58, 205, 0.9], [88, 208, 0.7], [118, 203.5, 0.8], [140, 206.5, 0.9], [30, 210, 0.7]]
    .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.light}"/>`).join('')
}

export function rocks(ids: IdSpace, R: ReefPalette) {
  const c = R.rock
  const a = piece(ids, {
    body: 'M-1 159 C9 153 23 154.5 32 163 C40 171 43.5 186 41 200 L-1 201 Z', fill: c.base, line: c.line,
    shades: [['M18 201 C29 195 35 184 34 168 L48 168 L48 201 Z', c.shade], ['M-1 162 C9 156.5 20 157.5 28 163.5 C18 161 8 163.5 -1 168 Z', c.light]],
    strokes: [['M16 176 C21 181 20 188 23 195', c.shade, 0.8], ['M6 172 C9 175 9.5 178 12 180', c.shade, 0.6]],
  })
  // small encrusting corals on the rock, so it reads as reef rock
  const crust = [[8, 182, 1.6, '#C67AA6'], [12, 185, 1.1, '#C67AA6'], [27, 176, 1.4, '#D9B35A'], [31, 190, 1.2, '#D07A6A'], [4, 192, 1.3, '#D9B35A']]
    .map(([x, y, rr, f]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${f}" stroke="${c.line}" stroke-width="0.4"/>`).join('')
  const pebble = (cx: number, cy: number, rx: number, ry: number) => piece(ids, {
    body: `M${cx - rx} ${cy} C${cx - rx} ${cy - ry} ${cx + rx} ${cy - ry} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 0.6} ${cx - rx} ${cy + ry * 0.6} ${cx - rx} ${cy} Z`,
    fill: c.base, line: c.line, width: 0.7, shades: [[`M${cx} ${cy - ry} L${cx + rx} ${cy - ry} L${cx + rx} ${cy + ry} L${cx} ${cy + ry} Z`, c.shade]],
  })
  return a + crust + pebble(46, 200, 5, 3.4)
}

/** Brain coral: a low dome with meandering grooves. */
export function brainCoral(ids: IdSpace, R: ReefPalette) {
  const c = R.brain
  const body = 'M74 200 C73 191 79 183.5 86 183.5 C93 183.5 99 191 98 200 Z'
  const grooves = [
    'M77 197 C79 195.4 81 197.6 83 196 C85 194.4 87 196.6 89 195 C91 193.6 93 195.6 95 194.4',
    'M78 192.4 C80 190.8 82 192.8 84 191.4 C86 190 88 192 90 190.6 C92 189.4 93.6 191 95 190',
    'M80.6 188 C82.4 186.6 84 188.4 86 187 C88 185.8 90 187.4 92 186.4',
  ]
  return piece(ids, {
    body, fill: c.base, line: c.line, width: 0.9,
    shades: [['M86 183 C93 184 99 191 98 201 L101 201 L101 183 Z', c.shade], ['M77 190 C78 186 82 184 86 184 C82 185.6 79.6 188 78.6 192 Z', c.light]],
    strokes: grooves.map((d) => [d, c.shade, 0.7] as const),
  })
}

type Finger = readonly [x: number, y: number, h: number, lean: number, w: number, tone: string]

/** Yellow finger coral: a few short, round-tipped fingers by the right wall. */
export function fingerCoral(ids: IdSpace, R: ReefPalette) {
  const c = R.finger
  const fingers: Finger[] = [[148, 200, 22, -3, 3.4, c.shade], [152, 200, 16, 2, 3, c.shade], [144, 200, 15, -4, 3.2, c.base], [150, 200, 26, 0, 3.6, c.base], [155, 200, 19, 3, 3.2, c.light]]
  return fingers
    .map(([x, y, h, lean, w, tone]) => piece(ids, {
      body: ribbonPath([[[x, y], [x + lean * 0.2, y - h * 0.4], [x + lean * 0.7, y - h * 0.8], [x + lean, y - h]]], (t) => w * (1 - 0.15 * t)),
      fill: tone, line: c.line, width: 0.6,
    }) + `<circle cx="${r2(x + lean * 0.9)}" cy="${r2(y - h * 0.86)}" r="0.6" fill="${c.light}"/>`).join('')
}

/** A branching (staghorn) coral: antler branches that fork and thin to round tips. */
export function staghorn(ids: IdSpace, R: ReefPalette) {
  const c = R.stag
  const br = (segs: readonly Seg[], w0: number, w1: number) => piece(ids, {
    body: ribbonPath(segs, (t) => w0 + (w1 - w0) * t + wob(0.2, 11)(t)), fill: c.base, line: c.line, width: 0.7,
    shades: [[ribbonPath(segs, (t) => (w0 + (w1 - w0) * t) * 0.42, { shift: (t) => (w0 + (w1 - w0) * t) * 0.3 }), c.shade]],
  })
  const tipsAt: Pt[] = [[18, 147], [32, 145], [41, 140], [50, 139], [58, 143], [72, 148]]
  const tips = tipsAt.map(([x, y]) => `<circle cx="${x}" cy="${y + 1.4}" r="0.8" fill="${c.light}"/>`).join('')
  return [
    br([[[45, 162], [42, 155], [40, 150], [41, 141]]], 3.6, 2.6), br([[[45, 162], [48, 155], [50, 150], [50, 140]]], 3.6, 2.6),
    br([[[45, 200], [45, 187], [45, 175], [45, 160]]], 5.6, 3.8),
    br([[[30, 167], [27, 161], [22, 156], [18, 148]]], 4.2, 2.8), br([[[30, 167], [32, 161], [33, 154], [32, 146]]], 4, 2.7),
    br([[[43, 200], [41, 188], [36, 178], [30, 166]]], 6, 4.3),
    br([[[60, 167], [63, 161], [68, 156], [72, 149]]], 4.2, 2.8), br([[[60, 167], [58, 160], [57, 154], [58, 144]]], 4, 2.7),
    br([[[47, 200], [49, 187], [54, 177], [60, 166]]], 6, 4.3),
  ].join('') + tips
}

/** A purple sea fan (gorgonian): a flat fan with branching veins and a few cross-links. */
export function seaFan(ids: IdSpace, R: ReefPalette) {
  const c = R.fan
  const body = 'M66 199 C57 188 47 162 50 142 C53 129 65 124 76 127.6 C88 132 89 160 81 178 C77 188 71 195 66 199 Z'
  const veins = [
    'M66 197 C62 186 56 168 54 146', 'M66 197 C64 180 62 160 62 134', 'M66 197 C68 178 70 156 72 130', 'M66 197 C70 182 78 164 82 146',
    'M58 166 C55 162 52 156 51.5 150', 'M63 154 C60 148 58 142 57 135', 'M70 152 C73 146 76 140 79 134', 'M76 170 C80 166 83 160 84.5 154',
    'M55 158 C58 157 61 157 63 158', 'M63 146 C66 145 69 145 71 146', 'M70 164 C73 163 76 163 79 164', 'M57 175 C60 174 63 174 65 175',
  ]
  return piece(ids, {
    body, fill: c.base, line: c.line, width: 1,
    shades: [['M70 125 C86 130 90 158 82 180 C78 188 72 195 66 200 L92 200 L92 125 Z', c.shade]],
    strokes: veins.map((d, i) => [d, i < 4 ? c.line : c.shade, i < 4 ? 0.9 : 0.7] as const),
    transform: 'translate(66 199) scale(0.74) translate(-66 -199)',
  })
}

type Arm = { back: boolean; d: string; tip: Pt }

/** A sea anemone on the rock: a short column and a crown of wavy, pink-tipped tentacles. */
export function anemone(ids: IdSpace, R: ReefPalette) {
  const col = R.anemCol, ten = R.anemTen
  const column = piece(ids, { body: 'M8 160 C8 156 10 153.6 14 153.6 C18 153.6 20 156 20 160 Z', fill: col.base, line: col.line, width: 0.7, shades: [['M14 153 L21 153 L21 161 L14 161 Z', col.shade]] })
  const arms: Arm[] = []
  for (let k = 0; k < 13; k++) {
    const t = k / 12, ang = -160 + t * 140, len = 9 + 4 * Math.sin(t * Math.PI) + (k % 3) * 0.8
    const rad = (ang * Math.PI) / 180
    const x0 = 14 + Math.cos(rad) * 3.4, y0 = 154 + Math.sin(rad) * 1.4
    const x3 = x0 + Math.cos(rad) * len, y3 = y0 + Math.sin(rad) * len
    const segs: Seg[] = [[[x0, y0], [x0 + Math.cos(rad) * len * 0.35 + 1.2, y0 + Math.sin(rad) * len * 0.35], [x3 - Math.cos(rad) * len * 0.3 - 1.2, y3 - Math.sin(rad) * len * 0.3], [x3, y3]]]
    arms.push({ back: k % 2 === 1, d: ribbonPath(segs, (tt) => 2.2 - 0.6 * tt), tip: [x3, y3] })
  }
  const draw = (a: Arm) => `<path d="${a.d}" fill="${a.back ? ten.shade : ten.base}" stroke="${ten.line}" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<circle cx="${r2(a.tip[0])}" cy="${r2(a.tip[1])}" r="1" fill="${ten.tip}"/>`
  return arms.filter((a) => a.back).map(draw).join('') + column + arms.filter((a) => !a.back).map(draw).join('')
}

/** A five-armed starfish on the sand, with a stipple of tube-foot bumps. */
export function starfish(ids: IdSpace, R: ReefPalette, cx: number, cy: number, ro: number, ri: number, deg: number) {
  const c = R.star
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = ((deg - 90 + k * 36) * Math.PI) / 180, rr = k % 2 ? ri : ro
    d += `${k ? ' L' : 'M'}${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr * 0.62)}`
  }
  const dots: string[] = []
  for (let k = 0; k < 5; k++) {
    const a = ((deg - 90 + k * 72) * Math.PI) / 180
    for (const f of [0.35, 0.62]) dots.push(`<circle cx="${r2(cx + Math.cos(a) * ro * f)}" cy="${r2(cy + Math.sin(a) * ro * f * 0.62)}" r="0.55" fill="${c.dot}"/>`)
  }
  return piece(ids, { body: `${d} Z`, fill: c.base, line: c.line, width: 0.7, shades: [[`M${cx} ${cy - ro} L${cx + ro} ${cy - ro} L${cx + ro} ${cy + ro} L${cx} ${cy + ro} Z`, c.shade]] }) + dots.join('')
}

/** A sea urchin at the foot of the rock: a dark round body and a halo of spines (none into the sand). */
export function urchin(ids: IdSpace, R: ReefPalette, cx: number, cy: number, r: number) {
  const c = R.urchin
  const spines: string[] = []
  for (let k = 0; k < 26; k++) {
    const a = -190 + k * (200 / 25) + (k % 2) * 3
    const rad = (a * Math.PI) / 180, len = r + 3.4 + (k % 3) * 1.2
    spines.push(`M${r2(cx + Math.cos(rad) * r * 0.7)} ${r2(cy + Math.sin(rad) * r * 0.7)} L${r2(cx + Math.cos(rad) * len)} ${r2(cy + Math.sin(rad) * len)}`)
  }
  return `<path d="${spines.join(' ')}" fill="none" stroke="${c.line}" stroke-width="0.7" stroke-linecap="round"/>` +
    piece(ids, { body: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} C${cx + r} ${cy + r * 0.5} ${cx - r} ${cy + r * 0.5} ${cx - r} ${cy} Z`, fill: c.base, line: c.line, width: 0.7,
      shades: [[`M${cx - r} ${cy - r * 0.2} C${cx - r * 0.4} ${cy - r * 0.9} ${cx + r * 0.2} ${cy - r} ${cx + r * 0.5} ${cy - r * 0.8} L${cx - r} ${cy - r * 2} Z`, c.light]] })
}

/** Shells on the sand: a ribbed scallop and a small spiral conch. */
export function shells(ids: IdSpace, R: ReefPalette) {
  const c = R.shell, k = R.conch
  const scallop = piece(ids, {
    body: 'M47 209 C45 205 47.4 201.6 51 201.6 C54.6 201.6 57 205 55 209 Z', fill: c.base, line: c.line, width: 0.6,
    strokes: ['M51 208.6 L48 203', 'M51 208.6 L50 202.2', 'M51 208.6 L52 202.2', 'M51 208.6 L54 203'].map((d) => [d, c.shade, 0.5] as const),
  }) + piece(ids, { body: 'M49.4 209 L52.6 209 L52 210.6 L50 210.6 Z', fill: c.shade, line: c.line, width: 0.5 })
  const conch = piece(ids, {
    body: 'M104 210 C103 206.4 106 203.6 110 204 C113 204.4 114.6 206.4 115.4 208.6 C113 210 108 210.8 104 210 Z', fill: k.base, line: k.line, width: 0.6,
    strokes: [['M107 204.4 C108.4 206 109.6 207.8 110 209.8', k.shade, 0.5], ['M110.4 204.2 C111.6 205.8 112.4 207.4 112.6 209.4', k.shade, 0.5]],
  })
  return scallop + conch
}
