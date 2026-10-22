import type { Habitat } from '@/features/fish/catalog'

/** The day's water that fills the tube completely. */
export const FULL_ML = 3000

export type TubeWater = { fill: string; hi: string }

/** The tube's water at a full 3 L, per habitat: river green and reef blue. */
export const HABITAT_WATER: Record<Habitat, TubeWater> = {
  fresh: { fill: '#2A9C80', hi: '#6ACDB2' },
  salt: { fill: '#1769C2', hi: '#4F98E6' },
}

type Vec = [number, number, number]

const parse = (h: string): Vec => {
  const c = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
  return [c(1), c(3), c(5)]
}
const toHex = (c: Vec) =>
  '#' +
  c
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const gam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

function toLab([r, g, b]: Vec): Vec {
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromLab([L, a, b]: Vec): Vec {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** Mixes two #RRGGBB colours in OKLab: t = 0 gives `a`, t = 1 gives `b`. */
export function mixOklab(a: string, b: string, t: number): string {
  const [a0, a1, a2] = toLab(parse(a))
  const [b0, b1, b2] = toLab(parse(b))
  return toHex(fromLab([a0 + (b0 - a0) * t, a1 + (b1 - a1) * t, a2 + (b2 - a2) * t]))
}

/** The tube's water at `ml`: from the theme's water to the habitat colour, linear up to 3 L. */
export function tubeWater(ml: number, habitat: Habitat, start: TubeWater): TubeWater {
  const t = Math.min(1, Math.max(0, ml / FULL_ML))
  const end = HABITAT_WATER[habitat]
  return { fill: mixOklab(start.fill, end.fill, t), hi: mixOklab(start.hi, end.hi, t) }
}
