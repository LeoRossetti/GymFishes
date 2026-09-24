/**
 * WCAG 2.x contrast and CIE L* lightness, for the theme audit (spec M7 §7.6). Pure; hex in,
 * numbers out. The WCAG ratio is right for text; for two dark surfaces its 0.05 offset hides
 * the difference, so surfaces are compared by L* instead.
 */

function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function linear(c8: number): number {
  const c = c8 / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Relative luminance Y, 0 for black and 1 for white. */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** CIE L*, 0 for black and 100 for white (D65 reference white). */
export function lightness(hex: string): number {
  const y = luminance(hex)
  const e = (6 / 29) ** 3
  const f = y > e ? Math.cbrt(y) : y / (3 * (6 / 29) ** 2) + 4 / 29
  return 116 * f - 16
}

export function lightnessDelta(a: string, b: string): number {
  return Math.abs(lightness(a) - lightness(b))
}
