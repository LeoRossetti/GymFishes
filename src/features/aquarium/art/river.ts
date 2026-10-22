// The river, ported from the approved art reference (docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs).
// Decor tones are pulled toward the river water so the scene sits back and the member's fish, drawn in full
// species colour on top, stays the hero.
import type { TubeWater } from '../color'
import { pieceVisible, type PieceSpec } from '../ladder'
import { fallenLeaf, type BubbleSource, type IdSpace } from './prims'
import { bed, log, moss, rocks, shortBlades, swordPlant, tallBlades } from './river-floor'
import { crab, farPlane, roots, school, shrimp } from './river-life'

/** Freshwater decor palette: earth and plant tones, already sunk a little toward the river green. */
const C = {
  bed: { base: '#4F6A4E', shade: '#3C523F', light: '#6B8663', line: '#1E3024' },
  rock: { base: '#536C68', shade: '#3D5350', light: '#728C86', line: '#1C2C2A' },
  moss: { base: '#5E9B3B', shade: '#457C2C', light: '#88BE5A', line: '#22441A' },
  wood: { base: '#5F4C37', shade: '#46372A', light: '#7F684B', line: '#20180F', cut: '#A08460', ring: '#6F583B' },
  blade: { base: '#3F975A', shade: '#2E7845', light: '#68B978', line: '#1B4728' },
  sword: { base: '#4CA05C', shade: '#357E45', light: '#7CC283', line: '#1B4728' },
  leafA: { base: '#B98B3C', shade: '#8F6627', light: '#D7AE5F', line: '#4D3511' },
  leafB: { base: '#A65A34', shade: '#7C4024', light: '#C77B51', line: '#47210F' },
  leafC: { base: '#9A8A44', shade: '#74652C', light: '#BBAA62', line: '#3E3410' },
  shrimp: { base: '#E1A274', shade: '#B67548', line: '#663A1C' },
  crab: { base: '#A8503C', shade: '#7B372A', light: '#CB7457', line: '#3C1911' },
  eye: '#0E1A14',
}
export type RiverPalette = typeof C

/**
 * Bubble sources spread across the floor, each joining at its litre mark. Every source lets out a small
 * seeded burst once per period, so the tube never shows a regular rhythm; few bubbles are up at once.
 */
export const RIVER_SOURCES: readonly BubbleSource[] = [
  { at: 1000, x: 131, y: 189, n: 3, seed: 3 },
  { at: 1500, x: 85, y: 185, n: 1, seed: 11 },
  { at: 2000, x: 62, y: 174, n: 2, seed: 7 },
  { at: 2500, x: 119, y: 193, n: 2, seed: 5 },
  { at: 3000, x: 37, y: 166, n: 1, seed: 13 },
]

type Draw = (scene: { ids: IdSpace; water: TubeWater; ml: number }) => string
type RiverPiece = PieceSpec & { name: string; draw: Draw }

/**
 * Every piece in paint order with the ml at which it joins the tube. The proposed ladder (one step every
 * 0,5 L) builds the river from the bottom up: floor pieces first, mid-water pieces last, once the
 * member's fish has risen above them.
 *   0,5 L plain water · 1 L riverbed, rocks, short grass, first bubbles · 1,5 L log, Amazon sword
 *   2 L shrimp, crab, leaves on the log and the floor, moss, the first two roots
 *   2,5 L the whole root fan, tall grass, the far bank · 3 L the school, drifting leaves
 * `midTop` (mid-water pieces only) is the piece's top edge in scene px, measured from these coordinates.
 */
const PIECES: readonly RiverPiece[] = [
  { at: 2500, name: 'far-bank', draw: ({ ids, water }) => farPlane(ids, water) },
  { at: 3000, midTop: 55, name: 'school', draw: ({ water }) => school(water) },
  { at: 2000, name: 'roots', draw: ({ ids, water, ml }) => roots(ids, C, water, ml) },
  { at: 2500, name: 'tall-grass', draw: ({ ids }) => tallBlades(ids, C) },
  { at: 1000, name: 'bed', draw: ({ ids }) => bed(ids, C) },
  { at: 1500, name: 'sword-plant', draw: ({ ids }) => swordPlant(ids, C) },
  { at: 1000, name: 'rocks', draw: ({ ids }) => rocks(ids, C) },
  { at: 1000, name: 'short-grass', draw: ({ ids }) => shortBlades(ids, C) },
  { at: 1500, name: 'log', draw: ({ ids }) => log(ids, C) },
  { at: 2000, name: 'moss', draw: ({ ids }) => moss(ids, C) },
  { at: 2000, name: 'leaf-bed', draw: ({ ids }) => fallenLeaf(ids, 64, 208.5, -7, 13, 4.6, C.leafB) },
  { at: 2000, name: 'leaf-log', draw: ({ ids }) => fallenLeaf(ids, 26, 181, -62, 13, 4.6, C.leafB) },
  { at: 3000, midTop: 101, name: 'leaf-drift-1', draw: ({ ids }) => fallenLeaf(ids, 12, 106, 24, 16, 5.6, C.leafA) },
  { at: 3000, midTop: 92, name: 'leaf-drift-2', draw: ({ ids }) => fallenLeaf(ids, 90, 98, 146, 12, 4.4, C.leafC) },
  { at: 2000, name: 'shrimp', draw: ({ ids }) => shrimp(ids, C, 74, 176.6, 0.72) },
  { at: 2000, name: 'crab', draw: ({ ids }) => crab(ids, C, 118.5, 191, 0.8) },
]

/**
 * The scene for a tube holding `ml` today, its water surface at `surfaceY` (scene px from the top): the
 * pieces' markup in paint order, each in a `<g data-piece>`, without the `<svg>` wrapper and the bubbles.
 */
export function riverScene(ml: number, water: TubeWater, surfaceY: number, ids: IdSpace): string {
  return PIECES.filter((p) => pieceVisible(p, ml, surfaceY))
    .map((p) => `<g data-piece="${p.name}">${p.draw({ ids, water, ml })}</g>`)
    .join('')
}

/**
 * The roots alone, for the air above the water: once the roots arrive they run from the top of the tube,
 * through the surface, down to the floor (the tree stands above the water). Shown clipped to the part of
 * the tube above the water; the underwater part stays in the scene in its paint order. Same piece name as the
 * underwater part, so both halves fade in together.
 */
export function riverInAir(ml: number, water: TubeWater, ids: IdSpace): string {
  if (ml < 2000) return ''
  return `<g data-piece="roots">${roots(ids, C, water, ml)}</g>`
}
