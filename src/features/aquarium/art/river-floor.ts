// The river floor, ported from the approved art reference (river.mjs): bed, rocks, grass, the Amazon
// sword, the log and the moss. Every coordinate and tone is the reference's; `C` is the river palette.
import { grass, mossCluster, piece, r2, type IdSpace } from './prims'
import type { RiverPalette } from './river'

export function bed(ids: IdSpace, C: RiverPalette) {
  const top = 'M0 199 C14 195 30 198 46 197 C64 196 80 200 98 199 C116 198 132 196 156 198'
  return piece(ids, {
    body: `${top} L156 216 L0 216 Z`, fill: C.bed.base,
    shades: [
      ['M0 208 C30 206 60 209 90 208 C120 207 140 209 156 208 L156 216 L0 216 Z', C.bed.shade],
      ['M0 199 C14 195 30 198 46 197 C30 199.5 14 199 0 201.5 Z', C.bed.light],
    ],
    strokes: [[top, C.bed.line, 0.8]],
  }) + [[60, 204, 1.6, 1.0], [70, 207, 1.1, 0.8], [86, 203.5, 1.3, 0.9], [100, 209, 1.5, 1], [116, 205, 1.2, 0.8], [144, 207, 1.5, 1]]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.rock.light}"/>`).join('')
}

export function rocks(ids: IdSpace, C: RiverPalette) {
  const a = piece(ids, {
    body: 'M-1 159 C9 153 23 154.5 32 163 C40 171 43.5 186 41 200 L-1 201 Z', fill: C.rock.base, line: C.rock.line,
    shades: [
      ['M18 201 C29 195 35 184 34 168 L48 168 L48 201 Z', C.rock.shade],
      ['M-1 162 C9 156.5 20 157.5 28 163.5 C18 161 8 163.5 -1 168 Z', C.rock.light],
    ],
    strokes: [['M16 176 C21 181 20 188 23 195', C.rock.shade, 0.8], ['M6 172 C9 175 9.5 178 12 180', C.rock.shade, 0.6]],
  })
  const b = piece(ids, {
    body: 'M29 200 C29 192 35 186.5 43 186.5 C51 186.5 56 193 55 200 Z', fill: C.rock.base, line: C.rock.line,
    shades: [['M45 186.5 C51 188 56 194 55 200 L41 200 C46 196 47.5 191 45 186.5 Z', C.rock.shade], ['M32 193 C34 189 38 187.5 42 187.5 C38 189.5 35 191.5 33.5 195 Z', C.rock.light]],
  })
  const pebble = (cx: number, cy: number, rx: number, ry: number) => piece(ids, {
    body: `M${cx - rx} ${cy} C${cx - rx} ${cy - ry} ${cx + rx} ${cy - ry} ${cx + rx} ${cy} C${cx + rx} ${cy + ry * 0.6} ${cx - rx} ${cy + ry * 0.6} ${cx - rx} ${cy} Z`,
    fill: C.rock.base, line: C.rock.line, width: 0.7,
    shades: [[`M${cx} ${cy - ry} L${cx + rx} ${cy - ry} L${cx + rx} ${cy + ry} L${cx} ${cy + ry} Z`, C.rock.shade]],
  })
  return a + b + pebble(98, 200, 6, 4) + pebble(108, 201.5, 4, 2.8)
}

type Blade = readonly [x: number, y: number, h: number, lean: number, arch: number, w: number, tone: string]

export function shortBlades(ids: IdSpace, C: RiverPalette) {
  const c = C.blade
  const blades: Blade[] = [
    [139, 201, 44, 6, 3, 4.2, c.shade], [122, 201, 34, -5, -2, 3.8, c.shade], [146, 201, 30, 4, 2, 3.4, c.base],
    [127, 201, 41, 3, -3, 4, c.base], [133, 201, 37, -2, 2.5, 3.6, c.light],
  ]
  return blades.map(([x, y, h, lean, arch, w, t]) => grass(ids, x, y, h, lean, arch, w, t, c.line)).join('')
}

export function tallBlades(ids: IdSpace, C: RiverPalette) {
  const c = C.blade
  const blades: Blade[] = [
    [131, 201, 118, 4, -10, 4.6, c.shade],
    [7, 192, 96, 8, 9, 4.4, c.shade], [15, 194, 70, -2, 6, 3.8, c.base],
  ]
  return blades.map(([x, y, h, lean, arch, w, t]) => grass(ids, x, y, h, lean, arch, w, t, c.line)).join('')
}

/** An Amazon sword leaf: a short stalk, then a lance blade with a midrib, rotated about its base. */
function swordLeaf(ids: IdSpace, x: number, y: number, deg: number, stalk: number, len: number, w: number, c: RiverPalette['sword']) {
  const top = -stalk - len
  const body = `M-0.9 0 L-0.9 ${-stalk} C${-w} ${r2(-stalk - len * 0.25)} ${r2(-w * 0.85)} ${r2(-stalk - len * 0.75)} 0 ${top} C${r2(w * 0.85)} ${r2(-stalk - len * 0.75)} ${w} ${r2(-stalk - len * 0.25)} 0.9 ${-stalk} L0.9 0 Z`
  return piece(ids, {
    body, fill: c.base, line: c.line, width: 0.7,
    shades: [[`M0 ${-stalk} L0 ${top} L${w + 2} ${top} L${w + 2} ${-stalk} Z`, c.shade]],
    strokes: [[`M0 ${-stalk + 1} L0 ${r2(top + 3)}`, c.light, 0.6]],
    transform: `translate(${x} ${y}) rotate(${deg})`,
  })
}

export function swordPlant(ids: IdSpace, C: RiverPalette) {
  const c = C.sword
  const leaves: (readonly [deg: number, stalk: number, len: number, w: number])[] = [[-36, 9, 26, 5], [-12, 11, 34, 6], [10, 10, 31, 5.5], [32, 8, 24, 5]]
  return leaves.map(([deg, s, l, w]) => swordLeaf(ids, 66, 195, deg, s, l, w, c)).join('')
}

export function log(ids: IdSpace, C: RiverPalette) {
  const c = C.wood
  const body = 'M22 181.2 C38 179.4 58 182.6 76 182.2 C90 181.9 100 184.4 110 184 L110 200 C98 200.2 86 198.2 70 198.6 C52 199 36 196.8 22 196.6 L19.6 194.4 L21.4 192 L17.8 189.2 L20.8 186.6 L18.6 183.6 Z'
  const trunk = piece(ids, {
    body, fill: c.base, line: c.line,
    shades: [['M16 190.5 C36 193.4 70 195 112 195.6 L112 202 L16 202 Z', c.shade], ['M22 182.6 C40 180.8 60 184 78 183.6 C92 183.3 102 185.6 109 185.4 L109 186.8 C96 187 86 185.6 76 185.6 C56 186 40 183.6 22 184.4 Z', c.light]],
    strokes: [
      ['M30 186.4 C44 186.8 52 188.6 64 188.2 C74 187.9 82 189.2 92 189.6', c.shade, 0.7],
      ['M36 191.8 C50 192.8 60 192.2 72 193 C82 193.6 90 193.4 99 194.4', c.shade, 0.7],
      ['M50 184.8 C56 185 60 186.2 66 186', c.line, 0.5], ['M88 196.2 C94 196.6 98 196.4 104 197', c.line, 0.5],
    ],
  })
  const knot = `<ellipse cx="82" cy="191" rx="3.2" ry="2.1" fill="${c.shade}" stroke="${c.line}" stroke-width="0.6"/><ellipse cx="82.3" cy="191" rx="1.3" ry="0.9" fill="${c.line}"/>`
  const stub = piece(ids, {
    body: 'M56 183.4 C56.5 178 59.5 173.5 63 171.5 C65.2 173.5 65.6 177.5 64 184 Z', fill: c.base, line: c.line, width: 0.8,
    shades: [['M60.5 172 C63 176 63.5 180 62 184.5 L66 184.5 L66 171 Z', c.shade]],
  })
  const cut = `<ellipse cx="110" cy="192" rx="5" ry="8" fill="${c.cut}" stroke="${c.line}" stroke-width="1"/>` +
    `<ellipse cx="110.3" cy="192" rx="3.1" ry="5" fill="none" stroke="${c.ring}" stroke-width="0.7"/>` +
    `<ellipse cx="110.5" cy="192" rx="1.2" ry="2" fill="${c.ring}"/>`
  return stub + trunk + knot + cut
}

export function moss(ids: IdSpace, C: RiverPalette) {
  return mossCluster(ids, C.moss, [[[-1, 128], [2, 138], [2, 148], [0, 157]]], (t) => 2.4 + 1.2 * Math.sin(t * Math.PI), { seed: 7, every: 2, jitter: 0.8 }) +
    mossCluster(ids, C.moss, [[[-1, 158], [8, 152.6], [19, 153.4], [28, 159.4]]], (t) => 3.4 - 1.2 * t, { seed: 3, every: 2, jitter: 1.2 }) +
    mossCluster(ids, C.moss, [[[28, 161], [32.5, 165.5], [36, 171], [37.6, 177]]], (t) => 2.6 - 0.8 * t, { seed: 11, every: 2, jitter: 0.9 }) +
    mossCluster(ids, C.moss, [[[34, 181.4], [41, 180.2], [49, 180.8], [56, 182.2]]], (t) => 2.2 + 0.8 * Math.sin(t * Math.PI), { seed: 5, every: 2, jitter: 0.9 })
}
