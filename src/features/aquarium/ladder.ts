/** The tube's inner box, in px (the scene is drawn in these units). */
export const SCENE_W = 156
export const SCENE_H = 216

/** `midTop` is the piece's top edge in scene px; only mid-water pieces have one. */
export type PieceSpec = { at: number; midTop?: number }

/** Scene px from the top where the water surface sits. */
export function surfaceYOf(ml: number, scaleMl: number): number {
  return SCENE_H * (1 - Math.min(1, ml / scaleMl))
}

/** A piece appears at its step; a mid-water piece also waits until the water covers its top edge. */
export function pieceVisible(p: PieceSpec, ml: number, surfaceY: number): boolean {
  if (ml < p.at) return false
  return p.midTop === undefined || surfaceY <= p.midTop
}

/** Fish top inside the water: 6 px under the crest, never lower than water height minus fish height. */
export function fishTop(waterPx: number, fishH: number): number {
  return Math.min(6, waterPx - fishH)
}
