// M10 aquarium art reference (river), the mockup Leo approved on the canvas (2026-10-21/22). Not product code: port it.
// Same language as the fish art: each piece is a body silhouette, flat tones clipped to it, and an
// outline in its darkest tone. Decor tones are pulled toward the river water so the scene sits back
// and the member's fish, drawn in full species colour on top, stays the hero.
// Box: the tube's inner area, 156 × 216 (160 × 220 minus the 2px border). y grows downward.

export const W = 156
export const H = 216
export const FULL_ML = 3000

// ---- colour ---------------------------------------------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const toHex = (c) => '#' + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
function toLab([r, g, b]) {
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function fromLab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)]
}
/** Mix two hex colours in OKLab: t = 0 gives a, t = 1 gives b. */
export function mix(a, b, t) {
  const A = toLab(hex(a)), B = toLab(hex(b))
  return toHex(fromLab(A.map((v, i) => v + (B[i] - v) * t)))
}

/** Today's tube water (Fundo do mar tokens) and the habitat end-colours at a full tube. */
export const WATER = {
  start: { fill: '#1CB0F6', hi: '#62CDFF' },
  fresh: { fill: '#2A9C80', hi: '#6ACDB2' },
  salt: { fill: '#1769C2', hi: '#4F98E6' },
}

/** The tube's water at `ml`: moves gradually from today's blue to the habitat colour at 3 L. */
export function waterAt(ml, habitat = 'fresh') {
  const t = Math.min(1, Math.max(0, ml / FULL_ML))
  const end = WATER[habitat]
  return { fill: mix(WATER.start.fill, end.fill, t), hi: mix(WATER.start.hi, end.hi, t) }
}

/** Freshwater decor palette: earth and plant tones, already sunk a little toward the river green. */
const C = {
  bed: { base: '#4F6A4E', shade: '#3C523F', light: '#6B8663', line: '#1E3024' },
  rock: { base: '#536C68', shade: '#3D5350', light: '#728C86', line: '#1C2C2A' },
  moss: { base: '#5E9B3B', shade: '#457C2C', light: '#88BE5A', line: '#22441A' },
  wood: { base: '#5F4C37', shade: '#46372A', light: '#7F684B', line: '#20180F', cut: '#A08460', ring: '#6F583B' },
  blade: { base: '#3F975A', shade: '#2E7845', light: '#68B978', line: '#1B4728' },
  sword: { base: '#4CA05C', shade: '#357E45', light: '#7CC283', line: '#1B4728' },
  leafA: { base: '#B98B3C', shade: '#8F6627', light: '#D7AE5F', line: '#4D3511' },
  leafB: { base: '#A65A34', shade: '#7C4024', light: '#C77B51', line: '#47210F' },
  leafC: { base: '#9A8A44', shade: '#74652C', light: '#BBAA62', line: '#3E3410' },
  shrimp: { base: '#E1A274', shade: '#B67548', line: '#663A1C' },
  crab: { base: '#A8503C', shade: '#7B372A', light: '#CB7457', line: '#3C1911' },
  eye: '#0E1A14',
}

// ---- drawing primitives -----------------------------------------------------------------------
export const r2 = (v) => Math.round(v * 100) / 100
let uid = 0
let idp = ''
/** Starts a scene's id space, so two tubes on one page never share clip ids. */
export function beginIds(prefix) { idp = prefix; uid = 0 }

/** A piece: body filled and outlined, tones clipped to the body, extra strokes on top. */
export function piece({ body, fill, line, width = 1, shades = [], strokes = [], transform }) {
  const id = `${idp}p${++uid}`
  const t = transform ? ` transform="${transform}"` : ''
  const clip = shades.length ? `<clipPath id="${id}"><path d="${body}"/></clipPath>` : ''
  const tones = shades.map(([d, f]) => `<path d="${d}" fill="${f}" clip-path="url(#${id})"/>`).join('')
  const lines = strokes.map(([d, c, w = 0.7]) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
  const outline = line ? `<path d="${body}" fill="none" stroke="${line}" stroke-width="${width}" stroke-linejoin="round"/>` : ''
  return `<g${t}>${clip}<path d="${body}" fill="${fill}"/>${tones}${lines}${outline}</g>`
}

// A ribbon: a width-varying band along a chain of cubic segments, edges smoothed with Catmull-Rom.
// Roots, grass and rootlets are ribbons, so their edges taper and wander like the real thing.
export const at3 = (s, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * s[0][k] + 3 * u * u * t * s[1][k] + 3 * u * t * t * s[2][k] + t * t * t * s[3][k]) }
export function samplePath(segs, per = 14) {
  const pts = []
  segs.forEach((s, i) => { for (let j = i ? 1 : 0; j <= per; j++) pts.push(at3(s, j / per)) })
  return pts
}
export function smooth(pts) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`
  }
  return d
}
/** Outline of a ribbon. `width(t)` in px, `shift(t)` moves the band sideways (for shading bands). */
export function ribbonPath(segs, width, { shift = () => 0, tip = 'round' } = {}) {
  const c = samplePath(segs)
  const n = c.length - 1
  const L = [], R = []
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const nx = -dy / len, ny = dx / len, t = i / n, w = width(t) / 2, o = shift(t)
    L.push([p[0] + nx * (w + o), p[1] + ny * (w + o)])
    R.push([p[0] - nx * (w - o), p[1] - ny * (w - o)])
  })
  const end = c[n], prev = c[n - 1], tl = Math.hypot(end[0] - prev[0], end[1] - prev[1]) || 1
  const ext = [end[0] + ((end[0] - prev[0]) / tl) * width(1) * 0.7, end[1] + ((end[1] - prev[1]) / tl) * width(1) * 0.7]
  const cap = tip === 'round' ? ` Q${r2(ext[0])} ${r2(ext[1])} ${r2(R[n][0])} ${r2(R[n][1])}` : ` L${r2(R[n][0])} ${r2(R[n][1])}`
  return `M${r2(L[0][0])} ${r2(L[0][1])}${smooth(L)}${cap}${smooth(R.slice().reverse())} Z`
}
/** A bark tick across a ribbon at t: a short line from one edge inward. */
export function tick(segs, t, width, side = 1, reach = 0.55) {
  const c = samplePath(segs), i = Math.round(t * (c.length - 1)), p = c[i]
  const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)]
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * side, ny = (dx / len) * side, w = width(t) / 2
  return `M${r2(p[0] + nx * w * 0.95)} ${r2(p[1] + ny * w * 0.95)} L${r2(p[0] + nx * w * (0.95 - reach) + dx / len * 0.8)} ${r2(p[1] + ny * w * (0.95 - reach) + dy / len * 0.8)}`
}
export const wob = (amp, f, ph = 0) => (t) => amp * Math.sin(t * f + ph)

/** A Vallisneria ribbon leaf from a floor point: `lean` sways the top, `arch` bends the tip over. */
export function grassSegs(x, y, h, lean, arch) {
  return [[[x, y], [x + lean * 0.1, y - h * 0.4], [x + lean * 0.6, y - h * 0.8], [x + lean + arch, y - h + Math.abs(arch) * 0.35]]]
}
export function grass(x, y, h, lean, arch, w, tone, line) {
  return piece({ body: ribbonPath(grassSegs(x, y, h, lean, arch), (t) => w * (1 - 0.3 * t) + wob(0.25, 9, x)(t)), fill: tone, line, width: 0.6 })
}

/** A tapering, curving grass blade (Vallisneria) from a floor point. */
function blade(x, y, h, bend, w, tone, line) {
  const d = `M${r2(x - w / 2)} ${y} C${r2(x - w / 2 + bend * 0.15)} ${r2(y - h * 0.45)} ${r2(x + bend * 0.75 - w * 0.35)} ${r2(y - h * 0.82)} ${r2(x + bend)} ${r2(y - h)} C${r2(x + bend * 0.75 + w * 0.35)} ${r2(y - h * 0.82)} ${r2(x + w / 2 + bend * 0.15)} ${r2(y - h * 0.45)} ${r2(x + w / 2)} ${y} Z`
  return piece({ body: d, fill: tone, line, width: 0.7 })
}

/** An Amazon sword leaf: a short stalk, then a lance blade with a midrib, rotated about its base. */
function swordLeaf(x, y, deg, stalk, len, w, c) {
  const top = -stalk - len
  const body = `M-0.9 0 L-0.9 ${-stalk} C${-w} ${r2(-stalk - len * 0.25)} ${r2(-w * 0.85)} ${r2(-stalk - len * 0.75)} 0 ${top} C${r2(w * 0.85)} ${r2(-stalk - len * 0.75)} ${w} ${r2(-stalk - len * 0.25)} 0.9 ${-stalk} L0.9 0 Z`
  return piece({
    body, fill: c.base, line: c.line, width: 0.7,
    shades: [[`M0 ${-stalk} L0 ${top} L${w + 2} ${top} L${w + 2} ${-stalk} Z`, c.shade]],
    strokes: [[`M0 ${-stalk + 1} L0 ${r2(top + 3)}`, c.light, 0.6]],
    transform: `translate(${x} ${y}) rotate(${deg})`,
  })
}

/** A fallen tree leaf, along +x from its stem, rotated and placed. */
export function fallenLeaf(x, y, deg, L, Wd, c) {
  const body = `M0 0 C${r2(L * 0.3)} ${r2(-Wd)} ${r2(L * 0.75)} ${r2(-Wd * 0.8)} ${L} 0 C${r2(L * 0.75)} ${r2(Wd * 0.8)} ${r2(L * 0.3)} ${r2(Wd)} 0 0 Z`
  const veins = [0.3, 0.55].flatMap((f) => [
    `M${r2(L * f)} 0 L${r2(L * (f + 0.13))} ${r2(-Wd * 0.5)}`,
    `M${r2(L * f)} 0 L${r2(L * (f + 0.13))} ${r2(Wd * 0.5)}`,
  ])
  return piece({
    body, fill: c.base, line: c.line, width: 0.7,
    shades: [[`M0 0 L${L} 0 L${L} ${Wd} L0 ${Wd} Z`, c.shade]],
    strokes: [[`M${r2(-L * 0.18)} 0 L${r2(L * 0.92)} 0`, c.line, 0.6], ...veins.map((d) => [d, c.line, 0.45])],
    transform: `translate(${x} ${y}) rotate(${deg})`,
  })
}

/** A bubble: water a touch lighter, a rim in the crest colour, one highlight. */
export function bubble(cx, cy, r, water) {
  const fill = mix(water.fill, '#FFFFFF', 0.3)
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${water.hi}" stroke-width="0.9"/>` +
    `<circle cx="${r2(cx - r * 0.35)}" cy="${r2(cy - r * 0.35)}" r="${r2(Math.max(0.45, r * 0.28))}" fill="#EAFBF5"/></g>`
}

// ---- the pieces, each with the litre mark where it appears ------------------------------------
function bed() {
  const top = 'M0 199 C14 195 30 198 46 197 C64 196 80 200 98 199 C116 198 132 196 156 198'
  return piece({
    body: `${top} L156 216 L0 216 Z`, fill: C.bed.base,
    shades: [
      ['M0 208 C30 206 60 209 90 208 C120 207 140 209 156 208 L156 216 L0 216 Z', C.bed.shade],
      ['M0 199 C14 195 30 198 46 197 C30 199.5 14 199 0 201.5 Z', C.bed.light],
    ],
    strokes: [[top, C.bed.line, 0.8]],
  }) + [[60, 204, 1.6, 1.0], [70, 207, 1.1, 0.8], [86, 203.5, 1.3, 0.9], [100, 209, 1.5, 1], [116, 205, 1.2, 0.8], [144, 207, 1.5, 1]]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.rock.light}"/>`).join('')
}

function rocks() {
  const a = piece({
    body: 'M-1 159 C9 153 23 154.5 32 163 C40 171 43.5 186 41 200 L-1 201 Z', fill: C.rock.base, line: C.rock.line,
    shades: [
      ['M18 201 C29 195 35 184 34 168 L48 168 L48 201 Z', C.rock.shade],
      ['M-1 162 C9 156.5 20 157.5 28 163.5 C18 161 8 163.5 -1 168 Z', C.rock.light],
    ],
    strokes: [['M16 176 C21 181 20 188 23 195', C.rock.shade, 0.8], ['M6 172 C9 175 9.5 178 12 180', C.rock.shade, 0.6]],
  })
  const b = piece({
    body: 'M29 200 C29 192 35 186.5 43 186.5 C51 186.5 56 193 55 200 Z', fill: C.rock.base, line: C.rock.line,
    shades: [['M45 186.5 C51 188 56 194 55 200 L41 200 C46 196 47.5 191 45 186.5 Z', C.rock.shade], ['M32 193 C34 189 38 187.5 42 187.5 C38 189.5 35 191.5 33.5 195 Z', C.rock.light]],
  })
  const pebble = (cx, cy, rx, ry) => piece({
    body: `M${cx - rx} ${cy} C${cx - rx} ${cy - ry} ${cx + rx} ${cy - ry} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 0.6} ${cx - rx} ${cy + ry * 0.6} ${cx - rx} ${cy} Z`,
    fill: C.rock.base, line: C.rock.line, width: 0.7,
    shades: [[`M${cx} ${cy - ry} L${cx + rx} ${cy - ry} L${cx + rx} ${cy + ry} L${cx} ${cy + ry} Z`, C.rock.shade]],
  })
  return a + b + pebble(98, 200, 6, 4) + pebble(108, 201.5, 4, 2.8)
}

function shortBlades() {
  const c = C.blade
  return [
    [139, 201, 44, 6, 3, 4.2, c.shade], [122, 201, 34, -5, -2, 3.8, c.shade], [146, 201, 30, 4, 2, 3.4, c.base],
    [127, 201, 41, 3, -3, 4, c.base], [133, 201, 37, -2, 2.5, 3.6, c.light],
  ].map(([x, y, h, lean, arch, w, t]) => grass(x, y, h, lean, arch, w, t, c.line)).join('')
}

function tallBlades() {
  const c = C.blade
  return [
    [131, 201, 118, 4, -10, 4.6, c.shade],
    [7, 192, 96, 8, 9, 4.4, c.shade], [15, 194, 70, -2, 6, 3.8, c.base],
  ].map(([x, y, h, lean, arch, w, t]) => grass(x, y, h, lean, arch, w, t, c.line)).join('')
}

/** The far bank: grass silhouettes in one tone a step darker than the water, no outline. */
function farPlane(water) {
  const tone = mix(water.fill, '#0A1421', 0.24)
  return [[44, 200, 92, 6, 8, 4.6], [53, 200, 120, -4, -10, 4.8], [61, 200, 78, 3, 6, 4.2], [80, 200, 104, 5, 9, 4.6], [90, 200, 70, -3, -5, 4],
    [100, 200, 96, -6, -8, 4.4], [34, 200, 64, 2, 5, 4]]
    .map(([x, y, h, lean, arch, w]) => piece({ body: ribbonPath(grassSegs(x, y, h, lean, arch), (t) => w * (1 - 0.3 * t)), fill: tone })).join('')
}

/** A school of small fish far off, as shadows: one flat tone, no outline, flowing along one curve. */
export function school(water) {
  const tone = mix(water.fill, '#0A1421', 0.3)
  const fish = 'M0 0 C2 -1.9 6 -2.1 8.2 -0.7 L10.4 -2 L9.8 0 L10.4 2 L8.2 0.7 C6 2.1 2 1.9 0 0 Z'
  const path = [[80, 79], [62, 74], [38, 70], [14, 57]] // tail of the school to its head; they swim toward the head
  let r = 4271
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5
  const out = []
  for (let tries = 0; out.length < 13 && tries < 400; tries++) {
    const t = 0.04 + 0.92 * (0.5 + (rnd() - 0.5) * (0.6 + 0.4 * rnd()) * 1.6) // denser in the middle
    if (t < 0 || t > 1) continue
    const p = at3(path, t), q = at3(path, Math.min(1, t + 0.02))
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy)
    const spread = 2 + 6.5 * Math.sin(Math.PI * t) ** 0.8
    const off = gauss() * spread
    const x = p[0] + (-dy / len) * off, y = p[1] + (dx / len) * off
    if (out.some((f) => Math.hypot(f.x - x, f.y - y) < 6)) continue
    const heading = (Math.atan2(dy, dx) * 180) / Math.PI - 180 + (rnd() - 0.5) * 10
    out.push({ x, y, deg: heading, sc: 0.6 + rnd() * 0.18 + 0.06 * t })
  }
  return out.map((f) => `<path d="${fish}" fill="${tone}" transform="translate(${r2(f.x)} ${r2(f.y)}) rotate(${r2(f.deg)}) scale(${r2(f.sc)})"/>`).join('')
}

function swordPlant() {
  const c = C.sword
  return [[-36, 9, 26, 5], [-12, 11, 34, 6], [10, 10, 31, 5.5], [32, 8, 24, 5]]
    .map(([deg, s, l, w]) => swordLeaf(66, 195, deg, s, l, w, c)).join('')
}

function log() {
  const c = C.wood
  const body = 'M22 181.2 C38 179.4 58 182.6 76 182.2 C90 181.9 100 184.4 110 184 L110 200 C98 200.2 86 198.2 70 198.6 C52 199 36 196.8 22 196.6 L19.6 194.4 L21.4 192 L17.8 189.2 L20.8 186.6 L18.6 183.6 Z'
  const trunk = piece({
    body, fill: c.base, line: c.line,
    shades: [['M16 190.5 C36 193.4 70 195 112 195.6 L112 202 L16 202 Z', c.shade], ['M22 182.6 C40 180.8 60 184 78 183.6 C92 183.3 102 185.6 109 185.4 L109 186.8 C96 187 86 185.6 76 185.6 C56 186 40 183.6 22 184.4 Z', c.light]],
    strokes: [
      ['M30 186.4 C44 186.8 52 188.6 64 188.2 C74 187.9 82 189.2 92 189.6', c.shade, 0.7],
      ['M36 191.8 C50 192.8 60 192.2 72 193 C82 193.6 90 193.4 99 194.4', c.shade, 0.7],
      ['M50 184.8 C56 185 60 186.2 66 186', c.line, 0.5], ['M88 196.2 C94 196.6 98 196.4 104 197', c.line, 0.5],
    ],
  })
  const knot = `<ellipse cx="82" cy="191" rx="3.2" ry="2.1" fill="${c.shade}" stroke="${c.line}" stroke-width="0.6"/><ellipse cx="82.3" cy="191" rx="1.3" ry="0.9" fill="${c.line}"/>`
  const stub = piece({
    body: 'M56 183.4 C56.5 178 59.5 173.5 63 171.5 C65.2 173.5 65.6 177.5 64 184 Z', fill: c.base, line: c.line, width: 0.8,
    shades: [['M60.5 172 C63 176 63.5 180 62 184.5 L66 184.5 L66 171 Z', c.shade]],
  })
  const cut = `<ellipse cx="110" cy="192" rx="5" ry="8" fill="${c.cut}" stroke="${c.line}" stroke-width="1"/>` +
    `<ellipse cx="110.3" cy="192" rx="3.1" ry="5" fill="none" stroke="${c.ring}" stroke-width="0.7"/>` +
    `<ellipse cx="110.5" cy="192" rx="1.2" ry="2" fill="${c.ring}"/>`
  return stub + trunk + knot + cut
}

/** A smooth bump on a width profile: knobs and nodes along roots. */
export const node = (at, h, sd = 0.035) => (t) => h * Math.exp(-(((t - at) / sd) ** 2))

function roots(water, ml = FULL_ML) {
  const c = C.wood
  const back = { base: mix(c.shade, water.fill, 0.4), line: mix(c.line, water.fill, 0.3) }
  const foot = (t) => (t > 0.93 ? (t - 0.93) * 40 : 0)
  const pores = (segs, width, ts) => ts.map((t) => {
    const pts = samplePath(segs), i = Math.round(t * (pts.length - 1)), p = pts[i]
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const k = -width(t) * 0.12
    return `<ellipse cx="${r2(p[0] + (-dy / len) * k)}" cy="${r2(p[1] + (dx / len) * k)}" rx="0.55" ry="0.8" fill="${c.cut}"/>`
  }).join('')
  const front = (segs, width, ticks, poreTs) => piece({
    body: ribbonPath(segs, width, { tip: 'flat' }), fill: c.base, line: c.line, width: 0.8,
    shades: [
      [ribbonPath(segs, (t) => width(t) * (0.42 + wob(0.14, 23, 1)(t)), { shift: (t) => width(t) * 0.3, tip: 'flat' }), c.shade],
      [ribbonPath(segs, (t) => width(t) * 0.13, { shift: (t) => -width(t) * 0.31, tip: 'flat' }), c.light],
    ],
    strokes: ticks.map((t) => [tick(segs, t, width, 1), c.line, 0.5]),
  }) + pores(segs, width, poreTs)
  const feet = (x, y, tone) => [[x, y, -4.5, 6], [x, y, 3.6, 5]].map(([fx, fy, dx, h]) =>
    piece({ body: ribbonPath([[[fx, fy - h], [fx + dx * 0.2, fy - h * 0.5], [fx + dx * 0.7, fy - 1], [fx + dx, fy + 1]]], (t) => 2.4 - 1.1 * t, { tip: 'flat' }), fill: tone.base, line: tone.line, width: 0.6 })).join('')
  /** A branch leaving `segs` at t, curving to `to` through `via`: drawn before its parent so the join hides. */
  const fork = (segs, t, via, to) => { const p = at3(segs[0], t); return [[p, [p[0] + (via[0] - p[0]) * 0.4, p[1] + (via[1] - p[1]) * 0.4], via, to]] }

  const A = [[[152, -4], [110, -4], [100, 60], [102, 199]]]
  const B = [[[154, -4], [128, -2], [118, 74], [121, 199]]]
  const E = [[[157, -4], [148, 2], [141, 84], [144, 199]]]
  const Cb = [[[153, -4], [136, -4], [130, 96], [133, 199]]]
  const A2 = fork(A, 0.74, [95, 178], [92, 199])
  const B2 = fork(B, 0.7, [127, 174], [130, 199])
  const wA = (t) => 9 - 4.6 * t + node(0.42, 1)(t) + node(0.66, 0.8)(t) + wob(0.35, 17)(t) + foot(t)
  const wB = (t) => 8.2 - 4.2 * t + node(0.5, 0.9)(t) + wob(0.3, 13, 2)(t) + foot(t)
  const wE = (t) => 7.4 - 3.6 * t + node(0.36, 0.8)(t) + wob(0.3, 11, 4)(t) + foot(t)
  const wC = (t) => 6.4 - 3 * t + node(0.55, 0.6)(t) + foot(t)
  const wFork = (t) => 4.2 - 1.8 * t + foot(t)
  const all = ml >= 2500
  return (all ? piece({ body: ribbonPath(Cb, wC, { tip: 'flat' }), fill: back.base, line: back.line, width: 0.7 }) + feet(133, 200, back) : '') +
    (all ? front(E, wE, [0.3, 0.55, 0.8], [0.2, 0.34, 0.5, 0.7]) + feet(144, 200, c) : '') +
    (all ? front(B2, wFork, [0.5], [0.3, 0.7]) + feet(130, 200, c) : '') +
    front(B, wB, [0.28, 0.5, 0.72], [0.16, 0.28, 0.42, 0.6]) + feet(121, 200, c) +
    (all ? front(A2, wFork, [0.5], [0.35]) : '') +
    front(A, wA, [0.3, 0.5, 0.7, 0.86], [0.14, 0.24, 0.38, 0.54, 0.72]) + feet(102, 200, c)
}

/**
 * Moss as a cluster of small round cushions along a baseline. Drawn as one silhouette: every cushion
 * first a little larger in the outline tone, then in the base tone, so only the outer edge keeps a line;
 * then a darker crescent low-right inside each cushion and a small highlight on some of them.
 */
export function mossCluster(base, radius, { seed = 1, every = 2, jitter = 1 } = {}) {
  const c = C.moss
  const pts = samplePath(base, 18)
  let rnd = seed
  const next = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280 }
  const blobs = []
  pts.forEach((p, i) => {
    if (i % every) return
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const off = (next() - 0.35) * jitter * 2
    blobs.push([p[0] + (dy / len) * off, p[1] - (dx / len) * off, radius(i / (pts.length - 1)) * (0.75 + next() * 0.5)])
  })
  const id = `${idp}m${++uid}`
  const circ = (dx, dy, k, add, fill) => blobs.map(([x, y, r]) => `<circle cx="${r2(x + dx * r)}" cy="${r2(y + dy * r)}" r="${r2(r * k + add)}" fill="${fill}"/>`).join('')
  return `<g><clipPath id="${id}">${blobs.map(([x, y, r]) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}"/>`).join('')}</clipPath>` +
    circ(0, 0, 1, 0.75, c.line) + circ(0, 0, 1, 0, c.base) +
    `<g clip-path="url(#${id})">${circ(0.45, 0.55, 0.85, 0, c.shade)}${circ(-0.1, -0.15, 0.62, 0, c.base)}</g>` +
    blobs.filter((_, i) => i % 2 === 0).map(([x, y, r]) => `<circle cx="${r2(x - r * 0.35)}" cy="${r2(y - r * 0.4)}" r="${r2(r * 0.28)}" fill="${c.light}"/>`).join('') + '</g>'
}

function moss() {
  return mossCluster([[[-1, 128], [2, 138], [2, 148], [0, 157]]], (t) => 2.4 + 1.2 * Math.sin(t * Math.PI), { seed: 7, every: 2, jitter: 0.8 }) +
    mossCluster([[[-1, 158], [8, 152.6], [19, 153.4], [28, 159.4]]], (t) => 3.4 - 1.2 * t, { seed: 3, every: 2, jitter: 1.2 }) +
    mossCluster([[[28, 161], [32.5, 165.5], [36, 171], [37.6, 177]]], (t) => 2.6 - 0.8 * t, { seed: 11, every: 2, jitter: 0.9 }) +
    mossCluster([[[34, 181.4], [41, 180.2], [49, 180.8], [56, 182.2]]], (t) => 2.2 + 0.8 * Math.sin(t * Math.PI), { seed: 5, every: 2, jitter: 0.9 })
}

function shrimp(x, y, s) {
  const c = C.shrimp
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M3.5 4.2 C1 2.4 -3 2 -7 3.6 M3.5 4.6 C1.2 6.2 -2 7.4 -5 9.2" fill="none" stroke="${c.line}" stroke-width="0.5" stroke-linecap="round"/>` +
    `<path d="M6 7 L5 9.2 M8.2 7.2 L7.4 9.4 M10.4 7 L9.8 9.2" fill="none" stroke="${c.line}" stroke-width="0.5" stroke-linecap="round"/>` +
    piece({
      body: 'M3 4.6 C4.2 2 8 1 12 2 C15 2.8 17.2 4.6 17.4 6.8 C15.4 6 13.2 6.1 11 6.6 C8 7.6 5 7.4 3 4.6 Z', fill: c.base, line: c.line, width: 0.6,
      shades: [['M3 5.6 C7 7 12 6.4 18 6 L18 9 L3 9 Z', c.shade]],
      strokes: [['M8 2.2 C7.6 4 7.8 5.6 8.4 7', c.shade, 0.5], ['M10.6 2.3 C10.4 4 10.6 5.4 11.2 6.6', c.shade, 0.5], ['M13.2 3 C13 4.4 13.2 5.4 13.8 6.3', c.shade, 0.5]],
    }) +
    piece({ body: 'M16.8 6.4 L19.4 4.3 L20 8.6 Z', fill: c.base, line: c.line, width: 0.5 }) +
    `<path d="M3.2 4 L0.6 3.4 L3 3.4" fill="none" stroke="${c.line}" stroke-width="0.5"/><circle cx="4.6" cy="3.5" r="0.75" fill="${C.eye}"/></g>`
}

function crab(x, y, s) {
  const c = C.crab
  const claw = (mx) => piece({
    body: 'M-1.5 3.5 C-3.2 1 -1 -0.8 1.2 0.4 C0.2 1.4 -0.4 2.4 1 3.4 C0 4.6 -1 4.6 -1.5 3.5 Z',
    fill: c.light, line: c.line, width: 0.55, transform: mx ? 'translate(18 0) scale(-1 1)' : undefined,
  })
  const legs = 'M3 7 L-0.4 10.4 M4.2 8.2 L1.6 12 M14 8.2 L16.6 12 M15 7 L18.4 10.4 M3.6 6 L0.2 3.4 M14.4 6 L17.8 3.4'
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="${legs}" fill="none" stroke="${c.line}" stroke-width="0.8" stroke-linecap="round"/>` +
    claw(false) + claw(true) +
    `<path d="M7 1.8 L6.4 -0.6 M11 1.8 L11.6 -0.6" stroke="${c.line}" stroke-width="0.6"/>` +
    piece({
      body: 'M2 6 C2 2.6 6 1 9 1 C12 1 16 2.6 16 6 C16 8.6 13 10 9 10 C5 10 2 8.6 2 6 Z', fill: c.base, line: c.line, width: 0.7,
      shades: [['M2 6.6 C6 8 12 8 16 6.6 L16 11 L2 11 Z', c.shade], ['M4.4 3.4 C6.4 2.2 8.4 1.9 10 2 C8 2.6 6.2 3.2 5 4.4 Z', c.light]],
    }) +
    `<circle cx="6.4" cy="-0.8" r="0.9" fill="${C.eye}"/><circle cx="11.6" cy="-0.8" r="0.9" fill="${C.eye}"/></g>`
}

/**
 * Bubble sources spread across the floor, each joining at its litre mark. Every source lets out a small
 * seeded burst once per period, so the tube never shows a regular rhythm; few bubbles are up at once.
 */
const SOURCES = [
  { at: 1000, x: 131, y: 189, n: 3, seed: 3 },
  { at: 1500, x: 85, y: 185, n: 1, seed: 11 },
  { at: 2000, x: 62, y: 174, n: 2, seed: 7 },
  { at: 2500, x: 119, y: 193, n: 2, seed: 5 },
  { at: 3000, x: 37, y: 166, n: 1, seed: 13 },
]
export const BUBBLE_PERIOD = 8

/** The animated bubbles for a tube whose water surface sits at `surfaceY` (scene px). */
export function bubbleField(ml, water, surfaceY, prefix, sources = SOURCES) {
  let css = '', svg = ''
  sources.filter((src) => ml >= src.at).forEach((src, si) => {
    let r = src.seed * 7919
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
    const t0 = rnd() * BUBBLE_PERIOD
    let lag = 0
    for (let k = 0; k < src.n; k++) {
      const rad = r2(1.5 + rnd() * 1.5)
      const speed = 30 + rad * 6
      const x = r2(src.x + (rnd() - 0.5) * 3)
      const rise = r2(src.y - (surfaceY + 6))
      if (rise <= 6) continue
      const f = Math.min(99, ((rise / speed) / BUBBLE_PERIOD) * 100)
      const start = r2((t0 + lag) % BUBBLE_PERIOD)
      lag += 0.35 + rnd() * 0.5
      const up = `${prefix}u${si}${k}`, side = `${prefix}s${si}${k}`, amp = r2(0.6 + rnd() * 1.2)
      css += `@keyframes ${up}{0%{transform:translateY(0) scale(.8);opacity:0}${r2(f * 0.06)}%{opacity:1}${r2(f * 0.9)}%{opacity:1}` +
        `${r2(f)}%{transform:translateY(${-rise}px) scale(1.12);opacity:0}100%{transform:translateY(${-rise}px) scale(1.12);opacity:0}}` +
        `@keyframes ${side}{from{transform:translateX(${-amp}px)}to{transform:translateX(${amp}px)}}`
      svg += `<g class="bubble" style="opacity:0;transform-box:fill-box;transform-origin:center;animation:${up} ${BUBBLE_PERIOD}s linear ${start}s infinite">` +
        `<g style="animation:${side} ${r2(0.8 + rnd() * 0.7)}s ease-in-out ${r2(-rnd())}s infinite alternate">${bubble(x, src.y, rad, water)}</g></g>`
    }
  })
  return `<style>${css}</style>${svg}`
}

/**
 * Every piece in paint order with the ml at which it joins the tube. The proposed ladder (one step every
 * 0,5 L) builds the river from the bottom up: floor pieces first, mid-water pieces last, once the
 * member's fish has risen above them.
 *   0,5 L plain water · 1 L riverbed, rocks, short grass, first bubbles · 1,5 L log, Amazon sword
 *   2 L shrimp, crab, leaves on the log and the floor, moss, the first two roots
 *   2,5 L the whole root fan, tall grass, the far bank · 3 L the school, drifting leaves
 */
const PIECES = [
  { at: 2500, draw: farPlane },
  { at: 3000, draw: school },
  { at: 2000, draw: roots },
  { at: 2500, draw: tallBlades },
  { at: 1000, draw: bed },
  { at: 1500, draw: swordPlant },
  { at: 1000, draw: rocks },
  { at: 1000, draw: shortBlades },
  { at: 1500, draw: log },
  { at: 2000, draw: moss },
  { at: 2000, draw: () => fallenLeaf(64, 208.5, -7, 13, 4.6, C.leafB) },
  { at: 2000, draw: () => fallenLeaf(26, 181, -62, 13, 4.6, C.leafB) },
  { at: 3000, draw: () => fallenLeaf(12, 106, 24, 16, 5.6, C.leafA) },
  { at: 3000, draw: () => fallenLeaf(90, 98, 146, 12, 4.4, C.leafC) },
  { at: 2000, draw: () => shrimp(74, 176.6, 0.72) },
  { at: 2000, draw: () => crab(118.5, 191, 0.8) },
]

/** The scene SVG for a tube holding `ml` today, its water surface at `surfaceY` (scene px from the top). */
export function freshScene(ml, { surfaceY = 0, prefix = 't' } = {}) {
  beginIds(`${prefix}f`)
  const water = waterAt(ml, 'fresh')
  const shown = PIECES.filter((p) => ml >= p.at).map((p) => p.draw(water, ml)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" style="display:block;overflow:visible">${shown}${bubbleField(ml, water, surfaceY, prefix)}</svg>`
}

/**
 * The roots alone, for the air above the water: once the roots arrive they run from the top of the tube,
 * through the surface, down to the floor (the tree stands above the water). Shown clipped to the part of
 * the tube above the water; the underwater part stays in the scene in its paint order.
 */
export function freshRootsInAir(ml, prefix = 't') {
  if (ml < 2000) return ''
  beginIds(`${prefix}a`)
  const water = waterAt(ml, 'fresh')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" style="display:block">${roots(water, ml)}</svg>`
}
