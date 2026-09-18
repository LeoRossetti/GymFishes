/** Only existing tokens: the six member accents plus the ink scale (spec §8). */
export type Tone =
  | 'accent-blue'
  | 'accent-green'
  | 'accent-yellow'
  | 'accent-orange'
  | 'accent-purple'
  | 'accent-pink'
  | 'ink'
  | 'ink-2'
  | 'ink-3'
  | 'ink-on-water'

/**
 * Every fish is the same five layers, drawn in this order: tail, body, fins, marks, eyes.
 * Paths live in the shared 64×40 viewBox, facing right. Keep to these layers and any fish can
 * be redrawn — or swapped for a Rive file — without touching `Fish.tsx`.
 */
export type FishArt = {
  body: string
  tail: string
  /** Where the tail wag rotates around, in viewBox units. */
  tailPivot: readonly [number, number]
  fins: readonly string[]
  marks: readonly string[]
  eyes: readonly (readonly [number, number])[]
  colors: { body: Tone; tail: Tone; fins: Tone; marks: Tone }
}
