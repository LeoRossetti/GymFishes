export type Bubble = {
  /** Horizontal position, % of the screen width. */
  left: number
  /** Diameter in px, 6–28, most of them small. */
  size: number
  delay: number
  duration: number
  /** How far it rises, px. */
  rise: number
  /** Sideways drift amplitude, px, signed. */
  sway: number
}

/** mulberry32 — a tiny seeded generator, so the pattern is irregular but the same on every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The bubbles behind a celebration (spec §7): a fixed, irregular field rather than an even row. */
export function bubbleField(count = 14, seed = 7): Bubble[] {
  const r = rng(seed)
  return Array.from({ length: count }, () => ({
    left: Math.round(4 + r() * 92),
    size: Math.round(6 + r() * r() * 22),
    delay: Math.round(r() * 1200) / 1000,
    duration: Math.round((1.6 + r()) * 100) / 100,
    rise: Math.round(340 + r() * 300),
    sway: Math.round(4 + r() * 10) * (r() < 0.5 ? -1 : 1),
  }))
}
