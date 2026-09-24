import type { Layer } from './types'

/** Outline width in art units — about 1px at the 100px celebration size. */
export const OUTLINE = 1.6

const n = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100))

/** The six member accents and the ink scale, as CSS variables — for art that draws from tokens. */
export function tone(token: string): string {
  return `var(--color-${token})`
}

/** A filled shape with an outline in its darkest tone. */
export function part(d: string, fill: string, line?: string, width = OUTLINE): Layer {
  return line ? { d, fill, stroke: line, strokeWidth: width } : { d, fill }
}

/** A flat tone clipped to the body: belly, back highlight, bands, spots. */
export function shade(d: string, fill: string): Layer {
  return { d, fill, clip: true }
}

/** A line with no fill: gill covers, mouths, throat grooves. */
export function stroke(d: string, color: string, width = 1): Layer {
  return { d, fill: 'none', stroke: color, strokeWidth: width }
}

/** Fin rays fanning from `origin` toward each tip, stopping at `reach` of the way. */
export function rays(
  origin: readonly [number, number],
  tips: readonly (readonly [number, number])[],
  color: string,
  reach = 0.85,
  width = 1,
): Layer {
  const [ox, oy] = origin
  const d = tips
    .map(([tx, ty]) => `M${n(ox)} ${n(oy)} L${n(ox + (tx - ox) * reach)} ${n(oy + (ty - oy) * reach)}`)
    .join(' ')
  return { d, fill: 'none', stroke: color, strokeWidth: width }
}

/** Rows of small leftward-open arcs (the visible edge of scales), odd rows offset by half a step. */
export function scaleRows(o: {
  x0: number
  x1: number
  y0: number
  rows: number
  dy: number
  dx: number
  r: number
  color: (row: number) => string
  width?: number
}): Layer[] {
  const out: Layer[] = []
  for (let row = 0; row < o.rows; row++) {
    const y = o.y0 + row * o.dy
    const offset = row % 2 ? o.dx / 2 : 0
    const arcs: string[] = []
    for (let x = o.x0 + offset; x <= o.x1; x += o.dx) {
      arcs.push(`M${n(x)} ${n(y - o.r)} a${n(o.r)} ${n(o.r)} 0 0 0 0 ${n(o.r * 2)}`)
    }
    out.push({ d: arcs.join(' '), fill: 'none', stroke: o.color(row), strokeWidth: o.width ?? 0.6, clip: true })
  }
  return out
}

/** Filled circles as one path: spots, suckers, iris rings. */
export function dots(points: readonly (readonly [number, number, number])[], fill: string, clip = false): Layer {
  const d = points
    .map(([cx, cy, r]) => `M${n(cx - r)} ${n(cy)} a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0 a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`)
    .join(' ')
  return clip ? { d, fill, clip: true } : { d, fill }
}
