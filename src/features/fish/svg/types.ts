/** The art box: 160×100, facing right (spec M7 §9.2). Same 1.6:1 as the old 64×40, so layout math holds. */
export const VIEW_W = 160
export const VIEW_H = 100

/**
 * One drawn shape. `fill` and `stroke` are any CSS colour: species palettes are hex (the
 * documented exception to tokens-only); eyes, locked silhouettes and the migrated old art
 * use `var(--color-…)`. `clip: true` clips the layer to the body silhouette — shading, scales
 * and markings use it so they never spill past the fish.
 */
export type Layer = {
  d: string
  fill: string
  stroke?: string
  strokeWidth?: number
  clip?: boolean
}

export type Eye = { cx: number; cy: number; r: number }

/**
 * Every fish is: the body silhouette (also the clip path), the tail layers (rotated by the idle
 * wag around `tailPivot`), the remaining layers in paint order, then the eyes. A fish can be
 * redrawn — or swapped for a Rive file — without touching `Fish.tsx`.
 */
export type FishArt = {
  body: string
  tailPivot: readonly [number, number]
  tail: readonly Layer[]
  layers: readonly Layer[]
  eyes: readonly Eye[]
  /** Only for art still drawn in the old 64×40 box; drop it when the fish is redrawn. */
  view?: readonly [number, number]
}
