// The aquarium's drawing primitives, ported from the approved art reference
// (docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs). Same language as the fish art: each piece is a
// body silhouette, flat tones clipped to it, and an outline in its darkest tone.
// Box: the tube's inner area, 156 × 216 (SCENE_W × SCENE_H). y grows downward.
import { mixOklab, type TubeWater } from '../color'

export type Pt = readonly [number, number]
/** A cubic segment: start, two controls, end. */
export type Seg = readonly [Pt, Pt, Pt, Pt]
/** A value along a path, t from 0 (start) to 1 (end): widths and sideways shifts. */
export type Profile = (t: number) => number
export type Tone = { base: string; shade: string; light: string; line: string }

/** A scene's id space, so two tubes on one page never share clip ids. */
export type IdSpace = { prefix: string; next(): string }

export function idSpace(prefix: string): IdSpace {
  let uid = 0
  return { prefix, next: () => String(++uid) }
}

export const r2 = (v: number) => Math.round(v * 100) / 100

/** `xs[i]` for an index the drawing knows is in range. */
export function nth<T>(xs: readonly T[], i: number): T {
  const x = xs[i]
  if (x === undefined) throw new Error(`no item at ${i}`)
  return x
}

export type PieceArgs = {
  body: string
  fill: string
  line?: string
  width?: number
  shades?: readonly (readonly [string, string])[]
  strokes?: readonly (readonly [string, string, number?])[]
  transform?: string
}

/** A piece: body filled and outlined, tones clipped to the body, extra strokes on top. */
export function piece(ids: IdSpace, { body, fill, line, width = 1, shades = [], strokes = [], transform }: PieceArgs) {
  const id = `${ids.prefix}p${ids.next()}`
  const t = transform ? ` transform="${transform}"` : ''
  const clip = shades.length ? `<clipPath id="${id}"><path d="${body}"/></clipPath>` : ''
  const tones = shades.map(([d, f]) => `<path d="${d}" fill="${f}" clip-path="url(#${id})"/>`).join('')
  const lines = strokes
    .map(
      ([d, c, w = 0.7]) =>
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('')
  const outline = line ? `<path d="${body}" fill="none" stroke="${line}" stroke-width="${width}" stroke-linejoin="round"/>` : ''
  return `<g${t}>${clip}<path d="${body}" fill="${fill}"/>${tones}${lines}${outline}</g>`
}

// A ribbon: a width-varying band along a chain of cubic segments, edges smoothed with Catmull-Rom.
// Roots, grass and rootlets are ribbons, so their edges taper and wander like the real thing.
export function at3(s: Seg, t: number): Pt {
  const u = 1 - t
  const k = (i: 0 | 1) => u * u * u * s[0][i] + 3 * u * u * t * s[1][i] + 3 * u * t * t * s[2][i] + t * t * t * s[3][i]
  return [k(0), k(1)]
}
export function samplePath(segs: readonly Seg[], per = 14): Pt[] {
  const pts: Pt[] = []
  segs.forEach((s, i) => {
    for (let j = i ? 1 : 0; j <= per; j++) pts.push(at3(s, j / per))
  })
  return pts
}
export function smooth(pts: readonly Pt[]): string {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = nth(pts, Math.max(0, i - 1)), p1 = nth(pts, i), p2 = nth(pts, i + 1), p3 = nth(pts, Math.min(pts.length - 1, i + 2))
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6] as const
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6] as const
    d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`
  }
  return d
}
/** Outline of a ribbon. `width(t)` in px, `shift(t)` moves the band sideways (for shading bands). */
export function ribbonPath(
  segs: readonly Seg[],
  width: Profile,
  { shift = () => 0, tip = 'round' }: { shift?: Profile; tip?: 'round' | 'flat' } = {},
): string {
  const c = samplePath(segs)
  const n = c.length - 1
  const L: Pt[] = [], R: Pt[] = []
  c.forEach((p, i) => {
    const a = nth(c, Math.max(0, i - 1)), b = nth(c, Math.min(n, i + 1))
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const nx = -dy / len, ny = dx / len, t = i / n, w = width(t) / 2, o = shift(t)
    L.push([p[0] + nx * (w + o), p[1] + ny * (w + o)])
    R.push([p[0] - nx * (w - o), p[1] - ny * (w - o)])
  })
  const end = nth(c, n), prev = nth(c, n - 1), tl = Math.hypot(end[0] - prev[0], end[1] - prev[1]) || 1
  const ext = [end[0] + ((end[0] - prev[0]) / tl) * width(1) * 0.7, end[1] + ((end[1] - prev[1]) / tl) * width(1) * 0.7] as const
  const rn = nth(R, n), l0 = nth(L, 0)
  const cap = tip === 'round' ? ` Q${r2(ext[0])} ${r2(ext[1])} ${r2(rn[0])} ${r2(rn[1])}` : ` L${r2(rn[0])} ${r2(rn[1])}`
  return `M${r2(l0[0])} ${r2(l0[1])}${smooth(L)}${cap}${smooth(R.slice().reverse())} Z`
}
/** A bark tick across a ribbon at t: a short line from one edge inward. */
export function tick(segs: readonly Seg[], t: number, width: Profile, side = 1, reach = 0.55): string {
  const c = samplePath(segs), i = Math.round(t * (c.length - 1)), p = nth(c, i)
  const a = nth(c, Math.max(0, i - 1)), b = nth(c, Math.min(c.length - 1, i + 1))
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * side, ny = (dx / len) * side, w = width(t) / 2
  return `M${r2(p[0] + nx * w * 0.95)} ${r2(p[1] + ny * w * 0.95)} L${r2(p[0] + nx * w * (0.95 - reach) + dx / len * 0.8)} ${r2(p[1] + ny * w * (0.95 - reach) + dy / len * 0.8)}`
}
export const wob = (amp: number, f: number, ph = 0): Profile => (t) => amp * Math.sin(t * f + ph)

/** A smooth bump on a width profile: knobs and nodes along roots. */
export const node = (at: number, h: number, sd = 0.035): Profile => (t) => h * Math.exp(-(((t - at) / sd) ** 2))

/** A Vallisneria ribbon leaf from a floor point: `lean` sways the top, `arch` bends the tip over. */
export function grassSegs(x: number, y: number, h: number, lean: number, arch: number): Seg[] {
  return [[[x, y], [x + lean * 0.1, y - h * 0.4], [x + lean * 0.6, y - h * 0.8], [x + lean + arch, y - h + Math.abs(arch) * 0.35]]]
}
export function grass(ids: IdSpace, x: number, y: number, h: number, lean: number, arch: number, w: number, tone: string, line: string) {
  return piece(ids, { body: ribbonPath(grassSegs(x, y, h, lean, arch), (t) => w * (1 - 0.3 * t) + wob(0.25, 9, x)(t)), fill: tone, line, width: 0.6 })
}

/** A fallen tree leaf, along +x from its stem, rotated and placed. */
export function fallenLeaf(ids: IdSpace, x: number, y: number, deg: number, L: number, Wd: number, c: Tone) {
  const body = `M0 0 C${r2(L * 0.3)} ${r2(-Wd)} ${r2(L * 0.75)} ${r2(-Wd * 0.8)} ${L} 0 C${r2(L * 0.75)} ${r2(Wd * 0.8)} ${r2(L * 0.3)} ${r2(Wd)} 0 0 Z`
  const veins = [0.3, 0.55].flatMap((f) => [
    `M${r2(L * f)} 0 L${r2(L * (f + 0.13))} ${r2(-Wd * 0.5)}`,
    `M${r2(L * f)} 0 L${r2(L * (f + 0.13))} ${r2(Wd * 0.5)}`,
  ])
  return piece(ids, {
    body, fill: c.base, line: c.line, width: 0.7,
    shades: [[`M0 0 L${L} 0 L${L} ${Wd} L0 ${Wd} Z`, c.shade]],
    strokes: [[`M${r2(-L * 0.18)} 0 L${r2(L * 0.92)} 0`, c.line, 0.6], ...veins.map((d) => [d, c.line, 0.45] as const)],
    transform: `translate(${x} ${y}) rotate(${deg})`,
  })
}

/**
 * Moss as a cluster of small round cushions along a baseline. Drawn as one silhouette: every cushion
 * first a little larger in the outline tone, then in the base tone, so only the outer edge keeps a line;
 * then a darker crescent low-right inside each cushion and a small highlight on some of them.
 */
export function mossCluster(
  ids: IdSpace,
  c: Tone,
  base: readonly Seg[],
  radius: Profile,
  { seed = 1, every = 2, jitter = 1 }: { seed?: number; every?: number; jitter?: number } = {},
) {
  const pts = samplePath(base, 18)
  let rnd = seed
  const next = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280 }
  const blobs: [number, number, number][] = []
  pts.forEach((p, i) => {
    if (i % every) return
    const a = nth(pts, Math.max(0, i - 1)), b = nth(pts, Math.min(pts.length - 1, i + 1))
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const off = (next() - 0.35) * jitter * 2
    blobs.push([p[0] + (dy / len) * off, p[1] - (dx / len) * off, radius(i / (pts.length - 1)) * (0.75 + next() * 0.5)])
  })
  const id = `${ids.prefix}m${ids.next()}`
  const circ = (dx: number, dy: number, k: number, add: number, fill: string) =>
    blobs.map(([x, y, r]) => `<circle cx="${r2(x + dx * r)}" cy="${r2(y + dy * r)}" r="${r2(r * k + add)}" fill="${fill}"/>`).join('')
  return `<g><clipPath id="${id}">${blobs.map(([x, y, r]) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}"/>`).join('')}</clipPath>` +
    circ(0, 0, 1, 0.75, c.line) + circ(0, 0, 1, 0, c.base) +
    `<g clip-path="url(#${id})">${circ(0.45, 0.55, 0.85, 0, c.shade)}${circ(-0.1, -0.15, 0.62, 0, c.base)}</g>` +
    blobs.filter((_, i) => i % 2 === 0).map(([x, y, r]) => `<circle cx="${r2(x - r * 0.35)}" cy="${r2(y - r * 0.4)}" r="${r2(r * 0.28)}" fill="${c.light}"/>`).join('') + '</g>'
}

/** A floor point bubbles rise from, joining the tube at its litre mark; `n` bubbles per burst, seeded. */
export type BubbleSource = { at: number; x: number; y: number; n: number; seed: number }

/** A bubble: water a touch lighter, a rim in the crest colour, one highlight. */
export function bubble(cx: number, cy: number, r: number, water: TubeWater) {
  const fill = mixOklab(water.fill, '#FFFFFF', 0.3)
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${water.hi}" stroke-width="0.9"/>` +
    `<circle cx="${r2(cx - r * 0.35)}" cy="${r2(cy - r * 0.35)}" r="${r2(Math.max(0.45, r * 0.28))}" fill="#EAFBF5"/></g>`
}
