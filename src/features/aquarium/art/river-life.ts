// The river's far plane and living pieces, ported from the approved art reference (river.mjs): the far
// bank, the school, the mangrove roots, the shrimp and the crab. `C` is the river palette.
import { FULL_ML, mixOklab, type TubeWater } from '../color'
import { at3, grassSegs, node, nth, piece, r2, ribbonPath, samplePath, tick, wob, type IdSpace, type Profile, type Pt, type Seg } from './prims'
import type { RiverPalette } from './river'

/** The far bank: grass silhouettes in one tone a step darker than the water, no outline. */
export function farPlane(ids: IdSpace, water: TubeWater) {
  const tone = mixOklab(water.fill, '#0A1421', 0.24)
  const blades: (readonly [x: number, y: number, h: number, lean: number, arch: number, w: number])[] = [
    [44, 200, 92, 6, 8, 4.6], [53, 200, 120, -4, -10, 4.8], [61, 200, 78, 3, 6, 4.2], [80, 200, 104, 5, 9, 4.6], [90, 200, 70, -3, -5, 4],
    [100, 200, 96, -6, -8, 4.4], [34, 200, 64, 2, 5, 4],
  ]
  return blades
    .map(([x, y, h, lean, arch, w]) => piece(ids, { body: ribbonPath(grassSegs(x, y, h, lean, arch), (t) => w * (1 - 0.3 * t)), fill: tone })).join('')
}

/** A school of small fish far off, as shadows: one flat tone, no outline, flowing along one curve. */
export function school(water: TubeWater) {
  const tone = mixOklab(water.fill, '#0A1421', 0.3)
  const fish = 'M0 0 C2 -1.9 6 -2.1 8.2 -0.7 L10.4 -2 L9.8 0 L10.4 2 L8.2 0.7 C6 2.1 2 1.9 0 0 Z'
  const path: Seg = [[80, 79], [62, 74], [38, 70], [14, 57]] // tail of the school to its head; they swim toward the head
  let r = 4271
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5
  const out: { x: number; y: number; deg: number; sc: number }[] = []
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

type RootTone = { base: string; line: string }

export function roots(ids: IdSpace, C: RiverPalette, water: TubeWater, ml = FULL_ML) {
  const c = C.wood
  const back: RootTone = { base: mixOklab(c.shade, water.fill, 0.4), line: mixOklab(c.line, water.fill, 0.3) }
  const foot: Profile = (t) => (t > 0.93 ? (t - 0.93) * 40 : 0)
  const pores = (segs: readonly Seg[], width: Profile, ts: readonly number[]) => ts.map((t) => {
    const pts = samplePath(segs), i = Math.round(t * (pts.length - 1)), p = nth(pts, i)
    const a = nth(pts, Math.max(0, i - 1)), b = nth(pts, Math.min(pts.length - 1, i + 1))
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
    const k = -width(t) * 0.12
    return `<ellipse cx="${r2(p[0] + (-dy / len) * k)}" cy="${r2(p[1] + (dx / len) * k)}" rx="0.55" ry="0.8" fill="${c.cut}"/>`
  }).join('')
  const front = (segs: readonly Seg[], width: Profile, ticks: readonly number[], poreTs: readonly number[]) => piece(ids, {
    body: ribbonPath(segs, width, { tip: 'flat' }), fill: c.base, line: c.line, width: 0.8,
    shades: [
      [ribbonPath(segs, (t) => width(t) * (0.42 + wob(0.14, 23, 1)(t)), { shift: (t) => width(t) * 0.3, tip: 'flat' }), c.shade],
      [ribbonPath(segs, (t) => width(t) * 0.13, { shift: (t) => -width(t) * 0.31, tip: 'flat' }), c.light],
    ],
    strokes: ticks.map((t) => [tick(segs, t, width, 1), c.line, 0.5] as const),
  }) + pores(segs, width, poreTs)
  const feet = (x: number, y: number, tone: RootTone) => ([[x, y, -4.5, 6], [x, y, 3.6, 5]] as const).map(([fx, fy, dx, h]) =>
    piece(ids, { body: ribbonPath([[[fx, fy - h], [fx + dx * 0.2, fy - h * 0.5], [fx + dx * 0.7, fy - 1], [fx + dx, fy + 1]]], (t) => 2.4 - 1.1 * t, { tip: 'flat' }), fill: tone.base, line: tone.line, width: 0.6 })).join('')
  /** A branch leaving `segs` at t, curving to `to` through `via`: drawn before its parent so the join hides. */
  const fork = (segs: readonly Seg[], t: number, via: Pt, to: Pt): Seg[] => { const p = at3(nth(segs, 0), t); return [[p, [p[0] + (via[0] - p[0]) * 0.4, p[1] + (via[1] - p[1]) * 0.4], via, to]] }

  const A: Seg[] = [[[152, -4], [110, -4], [100, 60], [102, 199]]]
  const B: Seg[] = [[[154, -4], [128, -2], [118, 74], [121, 199]]]
  const E: Seg[] = [[[157, -4], [148, 2], [141, 84], [144, 199]]]
  const Cb: Seg[] = [[[153, -4], [136, -4], [130, 96], [133, 199]]]
  const A2 = fork(A, 0.74, [95, 178], [92, 199])
  const B2 = fork(B, 0.7, [127, 174], [130, 199])
  const wA: Profile = (t) => 9 - 4.6 * t + node(0.42, 1)(t) + node(0.66, 0.8)(t) + wob(0.35, 17)(t) + foot(t)
  const wB: Profile = (t) => 8.2 - 4.2 * t + node(0.5, 0.9)(t) + wob(0.3, 13, 2)(t) + foot(t)
  const wE: Profile = (t) => 7.4 - 3.6 * t + node(0.36, 0.8)(t) + wob(0.3, 11, 4)(t) + foot(t)
  const wC: Profile = (t) => 6.4 - 3 * t + node(0.55, 0.6)(t) + foot(t)
  const wFork: Profile = (t) => 4.2 - 1.8 * t + foot(t)
  const all = ml >= 2500
  return (all ? piece(ids, { body: ribbonPath(Cb, wC, { tip: 'flat' }), fill: back.base, line: back.line, width: 0.7 }) + feet(133, 200, back) : '') +
    (all ? front(E, wE, [0.3, 0.55, 0.8], [0.2, 0.34, 0.5, 0.7]) + feet(144, 200, c) : '') +
    (all ? front(B2, wFork, [0.5], [0.3, 0.7]) + feet(130, 200, c) : '') +
    front(B, wB, [0.28, 0.5, 0.72], [0.16, 0.28, 0.42, 0.6]) + feet(121, 200, c) +
    (all ? front(A2, wFork, [0.5], [0.35]) : '') +
    front(A, wA, [0.3, 0.5, 0.7, 0.86], [0.14, 0.24, 0.38, 0.54, 0.72]) + feet(102, 200, c)
}

export function shrimp(ids: IdSpace, C: RiverPalette, x: number, y: number, s: number) {
  const c = C.shrimp
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M3.5 4.2 C1 2.4 -3 2 -7 3.6 M3.5 4.6 C1.2 6.2 -2 7.4 -5 9.2" fill="none" stroke="${c.line}" stroke-width="0.5" stroke-linecap="round"/>` +
    `<path d="M6 7 L5 9.2 M8.2 7.2 L7.4 9.4 M10.4 7 L9.8 9.2" fill="none" stroke="${c.line}" stroke-width="0.5" stroke-linecap="round"/>` +
    piece(ids, {
      body: 'M3 4.6 C4.2 2 8 1 12 2 C15 2.8 17.2 4.6 17.4 6.8 C15.4 6 13.2 6.1 11 6.6 C8 7.6 5 7.4 3 4.6 Z', fill: c.base, line: c.line, width: 0.6,
      shades: [['M3 5.6 C7 7 12 6.4 18 6 L18 9 L3 9 Z', c.shade]],
      strokes: [['M8 2.2 C7.6 4 7.8 5.6 8.4 7', c.shade, 0.5], ['M10.6 2.3 C10.4 4 10.6 5.4 11.2 6.6', c.shade, 0.5], ['M13.2 3 C13 4.4 13.2 5.4 13.8 6.3', c.shade, 0.5]],
    }) +
    piece(ids, { body: 'M16.8 6.4 L19.4 4.3 L20 8.6 Z', fill: c.base, line: c.line, width: 0.5 }) +
    `<path d="M3.2 4 L0.6 3.4 L3 3.4" fill="none" stroke="${c.line}" stroke-width="0.5"/><circle cx="4.6" cy="3.5" r="0.75" fill="${C.eye}"/></g>`
}

export function crab(ids: IdSpace, C: RiverPalette, x: number, y: number, s: number) {
  const c = C.crab
  const claw = (mx: boolean) => piece(ids, {
    body: 'M-1.5 3.5 C-3.2 1 -1 -0.8 1.2 0.4 C0.2 1.4 -0.4 2.4 1 3.4 C0 4.6 -1 4.6 -1.5 3.5 Z',
    fill: c.light, line: c.line, width: 0.55, transform: mx ? 'translate(18 0) scale(-1 1)' : undefined,
  })
  const legs = 'M3 7 L-0.4 10.4 M4.2 8.2 L1.6 12 M14 8.2 L16.6 12 M15 7 L18.4 10.4 M3.6 6 L0.2 3.4 M14.4 6 L17.8 3.4'
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="${legs}" fill="none" stroke="${c.line}" stroke-width="0.8" stroke-linecap="round"/>` +
    claw(false) + claw(true) +
    `<path d="M7 1.8 L6.4 -0.6 M11 1.8 L11.6 -0.6" stroke="${c.line}" stroke-width="0.6"/>` +
    piece(ids, {
      body: 'M2 6 C2 2.6 6 1 9 1 C12 1 16 2.6 16 6 C16 8.6 13 10 9 10 C5 10 2 8.6 2 6 Z', fill: c.base, line: c.line, width: 0.7,
      shades: [['M2 6.6 C6 8 12 8 16 6.6 L16 11 L2 11 Z', c.shade], ['M4.4 3.4 C6.4 2.2 8.4 1.9 10 2 C8 2.6 6.2 3.2 5 4.4 Z', c.light]],
    }) +
    `<circle cx="6.4" cy="-0.8" r="0.9" fill="${C.eye}"/><circle cx="11.6" cy="-0.8" r="0.9" fill="${C.eye}"/></g>`
}
