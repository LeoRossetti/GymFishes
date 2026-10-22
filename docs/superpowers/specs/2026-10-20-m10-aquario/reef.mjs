// M10 aquarium art reference (reef), the mockup Leo approved on the canvas (2026-10-22). Not product code: port it.
// Same language and the same ladder as the river (scene.mjs): every reef piece takes the place of a
// river piece at the same litre mark, so both habitats grow the same way. Decor tones are pulled
// toward the ocean blue; the member's fish keeps its full species palette on top.
import {
  H, W, beginIds, bubble, bubbleField, mix, piece, r2, ribbonPath, samplePath, school, waterAt, wob,
} from './river.mjs'

/** Saltwater decor palette, before sinking toward the ocean. */
const RAW = {
  sand: { base: '#A8A38A', shade: '#8A866F', light: '#C4BFA3', line: '#3D3A2B' },
  rock: { base: '#5E6677', shade: '#464D5D', light: '#7B8394', line: '#1F232D' },
  brain: { base: '#C68F57', shade: '#9C6B39', light: '#DDAE7A', line: '#4A3016' },
  stag: { base: '#D9806E', shade: '#AF5C4F', light: '#EDA390', line: '#55241E' },
  finger: { base: '#D2B44A', shade: '#A88E2E', light: '#E8CE72', line: '#544410' },
  fan: { base: '#9461A6', shade: '#70467E', light: '#B688C3', line: '#371C40' },
  anemCol: { base: '#B8564E', shade: '#8C3C36', line: '#4A1A16' },
  anemTen: { base: '#C7D98A', shade: '#A0B562', tip: '#E89BBE', line: '#4C5A22' },
  star: { base: '#E27B3C', shade: '#B85C26', light: '#F2A066', line: '#5C2A0E', dot: '#F6C08E' },
  urchin: { base: '#3D2E4C', shade: '#2A1F36', light: '#6A5680', line: '#140E1A' },
  shell: { base: '#E4D2B8', shade: '#C0A88A', light: '#F4E8D6', line: '#5C4A34' },
  conch: { base: '#D8B08A', shade: '#B08A64', light: '#ECCCA8', line: '#5C3E22' },
  kelp: { base: '#7E8B3C', shade: '#5F6C29', light: '#A3B25C', line: '#2D3511', bladder: '#98A64C' },
  iron: { base: '#555D68', shade: '#3B424C', light: '#76808B', line: '#15191F', rust: '#8B5E3C' },
  horse: { base: '#E2A93E', shade: '#B9832A', light: '#F2C870', line: '#5A3C0E' },
  eye: '#0E1A14',
}
const OCEAN = '#1769C2'
const SINK = { fan: 0.3, sand: 0.08, shell: 0.08, conch: 0.08, eye: 0 }
/** Every decor tone pulled a little toward the ocean blue (the fan further), like the river's toward its green. */
const R = Object.fromEntries(Object.entries(RAW).map(([k, v]) => {
  const t = SINK[k] ?? 0.15
  if (typeof v === 'string') return [k, t ? mix(v, OCEAN, t) : v]
  return [k, Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, mix(vv, OCEAN, t)]))]
}))

// ---- the floor ------------------------------------------------------------------------------
function sand() {
  const c = R.sand
  const top = 'M0 199 C16 196 34 198.4 52 197.6 C70 196.8 88 199.6 106 199 C124 198.4 140 196.6 156 198'
  return piece({
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

function rocks() {
  const c = R.rock
  const a = piece({
    body: 'M-1 159 C9 153 23 154.5 32 163 C40 171 43.5 186 41 200 L-1 201 Z', fill: c.base, line: c.line,
    shades: [['M18 201 C29 195 35 184 34 168 L48 168 L48 201 Z', c.shade], ['M-1 162 C9 156.5 20 157.5 28 163.5 C18 161 8 163.5 -1 168 Z', c.light]],
    strokes: [['M16 176 C21 181 20 188 23 195', c.shade, 0.8], ['M6 172 C9 175 9.5 178 12 180', c.shade, 0.6]],
  })
  // small encrusting corals on the rock, so it reads as reef rock
  const crust = [[8, 182, 1.6, '#C67AA6'], [12, 185, 1.1, '#C67AA6'], [27, 176, 1.4, '#D9B35A'], [31, 190, 1.2, '#D07A6A'], [4, 192, 1.3, '#D9B35A']]
    .map(([x, y, rr, f]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${f}" stroke="${c.line}" stroke-width="0.4"/>`).join('')
  const pebble = (cx, cy, rx, ry) => piece({
    body: `M${cx - rx} ${cy} C${cx - rx} ${cy - ry} ${cx + rx} ${cy - ry} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 0.6} ${cx - rx} ${cy + ry * 0.6} ${cx - rx} ${cy} Z`,
    fill: c.base, line: c.line, width: 0.7, shades: [[`M${cx} ${cy - ry} L${cx + rx} ${cy - ry} L${cx + rx} ${cy + ry} L${cx} ${cy + ry} Z`, c.shade]],
  })
  return a + crust + pebble(46, 200, 5, 3.4)
}

/** Brain coral: a low dome with meandering grooves. */
function brainCoral() {
  const c = R.brain
  const body = 'M74 200 C73 191 79 183.5 86 183.5 C93 183.5 99 191 98 200 Z'
  const grooves = [
    'M77 197 C79 195.4 81 197.6 83 196 C85 194.4 87 196.6 89 195 C91 193.6 93 195.6 95 194.4',
    'M78 192.4 C80 190.8 82 192.8 84 191.4 C86 190 88 192 90 190.6 C92 189.4 93.6 191 95 190',
    'M80.6 188 C82.4 186.6 84 188.4 86 187 C88 185.8 90 187.4 92 186.4',
  ]
  return piece({
    body, fill: c.base, line: c.line, width: 0.9,
    shades: [['M86 183 C93 184 99 191 98 201 L101 201 L101 183 Z', c.shade], ['M77 190 C78 186 82 184 86 184 C82 185.6 79.6 188 78.6 192 Z', c.light]],
    strokes: grooves.map((d) => [d, c.shade, 0.7]),
  })
}

/** Yellow finger coral: a few short, round-tipped fingers by the right wall. */
function fingerCoral() {
  const c = R.finger
  return [[148, 200, 22, -3, 3.4, c.shade], [152, 200, 16, 2, 3, c.shade], [144, 200, 15, -4, 3.2, c.base], [150, 200, 26, 0, 3.6, c.base], [155, 200, 19, 3, 3.2, c.light]]
    .map(([x, y, h, lean, w, tone]) => piece({
      body: ribbonPath([[[x, y], [x + lean * 0.2, y - h * 0.4], [x + lean * 0.7, y - h * 0.8], [x + lean, y - h]]], (t) => w * (1 - 0.15 * t)),
      fill: tone, line: c.line, width: 0.6,
    }) + `<circle cx="${r2(x + lean * 0.9)}" cy="${r2(y - h * 0.86)}" r="0.6" fill="${c.light}"/>`).join('')
}

/** A branching (staghorn) coral: antler branches that fork and thin to round tips. */
function staghorn() {
  const c = R.stag
  const br = (segs, w0, w1) => piece({
    body: ribbonPath(segs, (t) => w0 + (w1 - w0) * t + wob(0.2, 11)(t)), fill: c.base, line: c.line, width: 0.7,
    shades: [[ribbonPath(segs, (t) => (w0 + (w1 - w0) * t) * 0.42, { shift: (t) => (w0 + (w1 - w0) * t) * 0.3 }), c.shade]],
  })
  const tips = [[18, 147], [32, 145], [41, 140], [50, 139], [58, 143], [72, 148]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y + 1.4}" r="0.8" fill="${c.light}"/>`).join('')
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
function seaFan() {
  const c = R.fan
  const body = 'M66 199 C57 188 47 162 50 142 C53 129 65 124 76 127.6 C88 132 89 160 81 178 C77 188 71 195 66 199 Z'
  const veins = [
    'M66 197 C62 186 56 168 54 146', 'M66 197 C64 180 62 160 62 134', 'M66 197 C68 178 70 156 72 130', 'M66 197 C70 182 78 164 82 146',
    'M58 166 C55 162 52 156 51.5 150', 'M63 154 C60 148 58 142 57 135', 'M70 152 C73 146 76 140 79 134', 'M76 170 C80 166 83 160 84.5 154',
    'M55 158 C58 157 61 157 63 158', 'M63 146 C66 145 69 145 71 146', 'M70 164 C73 163 76 163 79 164', 'M57 175 C60 174 63 174 65 175',
  ]
  return piece({
    body, fill: c.base, line: c.line, width: 1,
    shades: [['M70 125 C86 130 90 158 82 180 C78 188 72 195 66 200 L92 200 L92 125 Z', c.shade]],
    strokes: veins.map((d, i) => [d, i < 4 ? c.line : c.shade, i < 4 ? 0.9 : 0.7]),
    transform: 'translate(66 199) scale(0.74) translate(-66 -199)',
  })
}

// ---- the anchor and its chain: the reef's answer to the mangrove roots ----------------------------
/** A sunken admiralty anchor, leaning, one fluke dug into the sand. */
function anchor() {
  const c = R.iron
  const ring = '<path d="M0 -43.4 A4.2 4.2 0 1 0 0 -35 A4.2 4.2 0 1 0 0 -43.4 Z M0 -41.6 A2.4 2.4 0 1 1 0 -36.8 A2.4 2.4 0 1 1 0 -41.6 Z" ' +
    `fill="${c.base}" fill-rule="evenodd" stroke="${c.line}" stroke-width="0.8"/>`
  const shank = piece({ body: 'M-2 -35.4 L2 -35.4 L2.6 -2 L-2.6 -2 Z', fill: c.base, line: c.line, width: 0.8, shades: [['M0.6 -36 L3 -36 L3 0 L0.6 0 Z', c.shade]], strokes: [['M-1 -33 L-1.3 -5', c.light, 0.6]] })
  const stock = piece({ body: 'M-13 -31.6 L13 -31.6 L13 -28.6 L-13 -28.6 Z', fill: c.base, line: c.line, width: 0.8, shades: [['M-14 -30 L14 -30 L14 -28 L-14 -28 Z', c.shade]] }) +
    [-13.8, 13.8].map((x) => `<circle cx="${x}" cy="-30.1" r="2" fill="${c.base}" stroke="${c.line}" stroke-width="0.7"/>`).join('')
  const arms = piece({
    body: 'M-17 -12 C-16 -2 -8 3.2 0 3.2 C8 3.2 16 -2 17 -12 L14 -11 C13 -4 7 -0.2 0 -0.2 C-7 -0.2 -13 -4 -14 -11 Z',
    fill: c.base, line: c.line, width: 0.8, shades: [['M-18 -2 C-8 4 8 4 18 -2 L18 6 L-18 6 Z', c.shade]],
  })
  const fluke = (sx) => piece({
    body: `M${14.4 * sx} -10.6 L${22.5 * sx} -20.5 L${12.4 * sx} -17.4 C${12.6 * sx} -15 ${13.4 * sx} -12.6 ${14.4 * sx} -10.6 Z`,
    fill: c.base, line: c.line, width: 0.8, shades: [[`M${16 * sx} -12 L${22.5 * sx} -20.5 L${24 * sx} -12 Z`, c.shade]],
  })
  const rust = [[-1.4, -24, 0.9], [1.2, -14, 0.7], [-9, -2.4, 0.8], [10, -5, 0.6], [-11.4, -30.2, 0.6]]
    .map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${c.rust}"/>`).join('')
  const body = `<g transform="translate(122 198) rotate(10) scale(0.92)">${fluke(-1)}${fluke(1)}${arms}${shank}${stock}${ring}${rust}</g>`
  // the left fluke and the crown sink into a small heap of sand
  const s = R.sand
  const heap = piece({ body: 'M101 201 C104 195.6 110 193.6 116 194.6 C121 195.4 125 197.4 129 200.6 Z', fill: s.base, line: s.line, width: 0.7, shades: [['M101 199 L129 199 L129 202 L101 202 Z', s.shade]] })
  return body + heap
}

/** The chain's path: from above the water down to the anchor's ring, with a slight sag. */
const CHAIN = [[[141, -8], [138, 50], [121, 112], [125.4, 157.4]]]

/** Chain links along the path: face-on rings and side-on bars alternate, like a real chain. */
function chain() {
  const c = R.iron
  const pts = samplePath(CHAIN, 80)
  const links = []
  let acc = 0, next = 0
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
    const d = Math.hypot(x1 - x0, y1 - y0)
    while (acc + d >= next) {
      const f = (next - acc) / d
      links.push({ x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, a: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI })
      next += 4.7
    }
    acc += d
  }
  const at = (l, inner) => `<g transform="translate(${r2(l.x)} ${r2(l.y)}) rotate(${r2(l.a - 90)})">${inner}</g>`
  const face = links.filter((_, i) => i % 2 === 0).map((l, i) => at(l,
    `<path d="M0 -3.5 A2.2 3.5 0 1 0 0 3.5 A2.2 3.5 0 1 0 0 -3.5 Z M0 -2.1 A0.85 2.1 0 1 1 0 2.1 A0.85 2.1 0 1 1 0 -2.1 Z" fill="${i % 5 === 3 ? mix(c.base, c.rust, 0.45) : c.base}" fill-rule="evenodd" stroke="${c.line}" stroke-width="0.55"/>` +
    `<path d="M-1.5 -2.2 C-1.6 -1 -1.6 0.6 -1.5 1.6" fill="none" stroke="${c.light}" stroke-width="0.45" stroke-linecap="round"/>`)).join('')
  const side = links.filter((_, i) => i % 2 === 1).map((l) => at(l,
    `<rect x="-0.95" y="-3.5" width="1.9" height="7" rx="0.95" fill="${c.shade}" stroke="${c.line}" stroke-width="0.55"/>`)).join('')
  return face + side
}

// ---- life on the reef --------------------------------------------------------------------------
/** A sea anemone on the rock: a short column and a crown of wavy, pink-tipped tentacles. */
function anemone() {
  const col = R.anemCol, ten = R.anemTen
  const column = piece({ body: 'M8 160 C8 156 10 153.6 14 153.6 C18 153.6 20 156 20 160 Z', fill: col.base, line: col.line, width: 0.7, shades: [['M14 153 L21 153 L21 161 L14 161 Z', col.shade]] })
  const arms = []
  for (let k = 0; k < 13; k++) {
    const t = k / 12, ang = -160 + t * 140, len = 9 + 4 * Math.sin(t * Math.PI) + (k % 3) * 0.8
    const rad = (ang * Math.PI) / 180
    const x0 = 14 + Math.cos(rad) * 3.4, y0 = 154 + Math.sin(rad) * 1.4
    const x3 = x0 + Math.cos(rad) * len, y3 = y0 + Math.sin(rad) * len
    const segs = [[[x0, y0], [x0 + Math.cos(rad) * len * 0.35 + 1.2, y0 + Math.sin(rad) * len * 0.35], [x3 - Math.cos(rad) * len * 0.3 - 1.2, y3 - Math.sin(rad) * len * 0.3], [x3, y3]]]
    arms.push({ back: k % 2 === 1, d: ribbonPath(segs, (tt) => 2.2 - 0.6 * tt), tip: [x3, y3] })
  }
  const draw = (a) => `<path d="${a.d}" fill="${a.back ? ten.shade : ten.base}" stroke="${ten.line}" stroke-width="0.5" stroke-linejoin="round"/>` +
    `<circle cx="${r2(a.tip[0])}" cy="${r2(a.tip[1])}" r="1" fill="${ten.tip}"/>`
  return arms.filter((a) => a.back).map(draw).join('') + column + arms.filter((a) => !a.back).map(draw).join('')
}

/** A five-armed starfish on the sand, with a stipple of tube-foot bumps. */
function starfish(cx, cy, ro, ri, deg) {
  const c = R.star
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = ((deg - 90 + k * 36) * Math.PI) / 180, rr = k % 2 ? ri : ro
    d += `${k ? ' L' : 'M'}${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr * 0.62)}`
  }
  const dots = []
  for (let k = 0; k < 5; k++) {
    const a = ((deg - 90 + k * 72) * Math.PI) / 180
    for (const f of [0.35, 0.62]) dots.push(`<circle cx="${r2(cx + Math.cos(a) * ro * f)}" cy="${r2(cy + Math.sin(a) * ro * f * 0.62)}" r="0.55" fill="${c.dot}"/>`)
  }
  return piece({ body: `${d} Z`, fill: c.base, line: c.line, width: 0.7, shades: [[`M${cx} ${cy - ro} L${cx + ro} ${cy - ro} L${cx + ro} ${cy + ro} L${cx} ${cy + ro} Z`, c.shade]] }) + dots.join('')
}

/** A sea urchin at the foot of the rock: a dark round body and a halo of spines (none into the sand). */
function urchin(cx, cy, r) {
  const c = R.urchin
  const spines = []
  for (let k = 0; k < 26; k++) {
    const a = -190 + k * (200 / 25) + (k % 2) * 3
    const rad = (a * Math.PI) / 180, len = r + 3.4 + (k % 3) * 1.2
    spines.push(`M${r2(cx + Math.cos(rad) * r * 0.7)} ${r2(cy + Math.sin(rad) * r * 0.7)} L${r2(cx + Math.cos(rad) * len)} ${r2(cy + Math.sin(rad) * len)}`)
  }
  return `<path d="${spines.join(' ')}" fill="none" stroke="${c.line}" stroke-width="0.7" stroke-linecap="round"/>` +
    piece({ body: `M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy} C${cx + r} ${cy + r * 0.5} ${cx - r} ${cy + r * 0.5} ${cx - r} ${cy} Z`, fill: c.base, line: c.line, width: 0.7,
      shades: [[`M${cx - r} ${cy - r * 0.2} C${cx - r * 0.4} ${cy - r * 0.9} ${cx + r * 0.2} ${cy - r} ${cx + r * 0.5} ${cy - r * 0.8} L${cx - r} ${cy - r * 2} Z`, c.light]] })
}

/** Shells on the sand: a ribbed scallop and a small spiral conch. */
function shells() {
  const c = R.shell, k = R.conch
  const scallop = piece({
    body: 'M47 209 C45 205 47.4 201.6 51 201.6 C54.6 201.6 57 205 55 209 Z', fill: c.base, line: c.line, width: 0.6,
    strokes: ['M51 208.6 L48 203', 'M51 208.6 L50 202.2', 'M51 208.6 L52 202.2', 'M51 208.6 L54 203'].map((d) => [d, c.shade, 0.5]),
  }) + piece({ body: 'M49.4 209 L52.6 209 L52 210.6 L50 210.6 Z', fill: c.shade, line: c.line, width: 0.5 })
  const conch = piece({
    body: 'M104 210 C103 206.4 106 203.6 110 204 C113 204.4 114.6 206.4 115.4 208.6 C113 210 108 210.8 104 210 Z', fill: k.base, line: k.line, width: 0.6,
    strokes: [['M107 204.4 C108.4 206 109.6 207.8 110 209.8', k.shade, 0.5], ['M110.4 204.2 C111.6 205.8 112.4 207.4 112.6 209.4', k.shade, 0.5]],
  })
  return scallop + conch
}

/** Kelp: a wavy stipe with long blades on alternating sides, a small bladder at each blade's base. */
function kelpPlant(x, y, h, lean, seed) {
  const c = R.kelp
  const stipe = [[[x, y], [x + lean * 0.3 + 3, y - h * 0.35], [x + lean * 0.7 - 3, y - h * 0.7], [x + lean, y - h]]]
  const pts = samplePath(stipe, 40)
  let out = piece({ body: ribbonPath(stipe, (t) => 1.8 - 0.6 * t), fill: c.shade, line: c.line, width: 0.5 })
  for (let k = 0; k < 7; k++) {
    const i = Math.round(((k + 1) / 8) * (pts.length - 1)), p = pts[i]
    const side = k % 2 ? 1 : -1, len = 11 + ((seed * 7 + k * 5) % 6)
    const segs = [[[p[0], p[1]], [p[0] + side * len * 0.35, p[1] - len * 0.25], [p[0] + side * len * 0.7, p[1] - len * 0.55 + 2], [p[0] + side * len * 0.95, p[1] - len * 0.8]]]
    out += piece({ body: ribbonPath(segs, (t) => 3.6 * Math.sin(Math.PI * (0.15 + t * 0.85)) + 0.4), fill: k % 3 === 1 ? c.light : c.base, line: c.line, width: 0.55 })
    out += `<circle cx="${r2(p[0] + side * 1.2)}" cy="${r2(p[1] - 0.6)}" r="1.25" fill="${c.bladder}" stroke="${c.line}" stroke-width="0.45"/>`
  }
  return out
}
function kelp() {
  return kelpPlant(13, 196, 118, 4, 1) + kelpPlant(5, 194, 96, 8, 2)
}

/** A small seahorse holding the kelp with its tail. */
function seahorse(x, y, s) {
  const c = R.horse
  const body = 'M5.2 1.2 C7 0.2 9 0.6 9.6 2.4 L13.6 3.2 C14 3.5 14 4.4 13.6 4.6 L9.8 5.2 C10.8 7.4 10.6 10.4 8.8 12.6 C7.6 14 5.6 14.2 4.4 13 C3.4 11.6 4 9.8 4.2 8.4 C3.2 7.6 2.8 6 3.2 4.6 C3.4 3 4 1.8 5.2 1.2 Z'
  const tail = ribbonPath([[[5.4, 12.8], [4.4, 15.6], [6.2, 18.6], [7.8, 17.2]], [[7.8, 17.2], [8.8, 16], [7.2, 15.2], [6.6, 16.4]]], (t) => 2.2 - 1.6 * t)
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    piece({ body: tail, fill: c.base, line: c.line, width: 0.5 }) +
    piece({ body: 'M4.2 8.6 C2.4 8.4 1.8 10 2.2 11.4 L4 10.8 Z', fill: c.light, line: c.line, width: 0.4 }) +
    piece({ body, fill: c.base, line: c.line, width: 0.55, shades: [['M3 6 C5 8 6 11 5 14 L2 14 L2 6 Z', c.shade]],
      strokes: [['M5.2 8.8 L8.6 9.4', c.shade, 0.4], ['M5 10.4 L8.2 10.8', c.shade, 0.4], ['M5.4 12 L7.6 12.2', c.shade, 0.4], ['M5.6 1.4 L5.2 0.2 M6.8 0.7 L6.8 -0.4 M8 0.8 L8.4 -0.2', c.line, 0.4]] }) +
    `<circle cx="8.1" cy="2.9" r="0.75" fill="${R.eye}"/></g>`
}

/** A small moon jellyfish drifting: a pale bell with four lilac rings and trailing tentacles. */
function jelly(x, y, s, deg, water) {
  const bell = mix(water.fill, '#FFFFFF', 0.42), rim = mix(water.fill, '#FFFFFF', 0.7), ring = mix(water.fill, '#D7A6E0', 0.62)
  const tent = [-4.6, -2, 1, 3.8].map((tx, i) => `M${tx} 0.6 C${tx - 1.4} 4 ${tx + 1.4} 7 ${tx - 0.6} ${10 + (i % 2) * 2}`).join(' ')
  return `<g transform="translate(${x} ${y}) rotate(${deg}) scale(${s})">` +
    `<path d="${tent}" fill="none" stroke="${rim}" stroke-width="0.5" stroke-linecap="round"/>` +
    `<path d="M-2.2 0.6 C-2.6 3 -1.4 5 -2 7 M2 0.6 C2.6 3 1.6 5 2.2 7" fill="none" stroke="${bell}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<path d="M-6 0.6 C-6 -5.6 6 -5.6 6 0.6 C4.6 1.4 3.4 0.4 2 1.2 C0.6 0.4 -0.6 1.4 -2 0.8 C-3.4 1.4 -4.6 0.4 -6 0.6 Z" fill="${bell}" stroke="${rim}" stroke-width="0.6"/>` +
    [[-2.2, -1.8], [0, -2.8], [2.2, -1.8]].map(([rx, ry]) => `<circle cx="${rx}" cy="${ry}" r="0.95" fill="none" stroke="${ring}" stroke-width="0.6"/>`).join('') + '</g>'
}

/** The far reef: coral heads and kelp as silhouettes in one tone a step darker than the water. */
function farReef(water) {
  const tone = mix(water.fill, '#0A1421', 0.24)
  const heads = 'M28 200 C28 190 34 184 40 186 C42 178 50 174 56 179 C60 172 70 172 72 180 C78 176 86 178 87 186 C92 182 100 184 101 192 C106 190 112 194 112 200 Z'
  const fronds = [[[[36, 198], [40, 170], [30, 140], [36, 108]]], [[[60, 198], [56, 172], [66, 150], [60, 124]]]]
    .map((segs) => ribbonPath(segs, (t) => 4 * (1 - 0.4 * t)))
  return [fronds[0], fronds[1], heads].map((d) => `<path d="${d}" fill="${tone}"/>`).join('')
}

// ---- the ladder ------------------------------------------------------------------------------
/** Every reef piece in paint order with the ml at which it joins: the river's ladder, piece for piece. */
const PIECES = [
  { at: 2500, draw: farReef },
  { at: 3000, draw: school },
  { at: 2500, draw: kelp },
  { at: 1000, draw: sand },
  { at: 1500, draw: seaFan },
  { at: 1000, draw: rocks },
  { at: 1000, draw: brainCoral },
  { at: 1000, draw: fingerCoral },
  { at: 1500, draw: staghorn },
  { at: 2000, draw: chain },
  { at: 2000, draw: anchor },
  { at: 2000, draw: anemone },
  { at: 2000, draw: shells },
  { at: 2000, draw: () => urchin(42, 196, 4.4) },
  { at: 2000, draw: () => starfish(64, 205.4, 7.4, 3, 14) },
  { at: 2500, draw: () => seahorse(9, 98, 1.15) },
  { at: 3000, draw: (water) => jelly(62, 122, 1, -6, water) + jelly(94, 96, 0.82, 10, water) },
]

const SOURCES = [
  { at: 1000, x: 149, y: 176, n: 3, seed: 3 },
  { at: 1500, x: 45, y: 140, n: 1, seed: 11 },
  { at: 2000, x: 86, y: 183, n: 2, seed: 7 },
  { at: 2500, x: 118, y: 194, n: 2, seed: 5 },
  { at: 3000, x: 22, y: 150, n: 1, seed: 13 },
]

/** The reef SVG for a tube holding `ml` today, its water surface at `surfaceY`. */
export function reefScene(ml, { surfaceY = 0, prefix = 't' } = {}) {
  beginIds(`${prefix}r`)
  const water = waterAt(ml, 'salt')
  const shown = PIECES.filter((p) => ml >= p.at).map((p) => p.draw(water, ml)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" style="display:block;overflow:visible">${shown}${bubbleField(ml, water, surfaceY, prefix, SOURCES)}</svg>`
}

/** The chain alone, for the air above the water (it comes from a boat above, like the mangrove's tree). */
export function reefChainInAir(ml, prefix = 't') {
  if (ml < 2000) return ''
  beginIds(`${prefix}c`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" style="display:block">${chain()}</svg>`
}

export { bubble }
