// The reef, ported from the approved art reference (docs/superpowers/specs/2026-10-20-m10-aquario/reef.mjs).
// Same language and the same ladder as the river: every reef piece takes the place of a river piece at the
// same litre mark, so both habitats grow the same way. Decor tones are pulled toward the ocean blue; the
// member's fish keeps its full species palette on top.
import { mixOklab, type TubeWater } from '../color'
import { pieceVisible, type PieceSpec } from '../ladder'
import type { BubbleSource, IdSpace } from './prims'
import { anemone, brainCoral, fingerCoral, rocks, sand, seaFan, shells, staghorn, starfish, urchin } from './reef-floor'
import { anchor, chain, farReef, jelly, kelp, seahorse } from './reef-life'
import { school } from './river-life'

/** Saltwater decor palette, before sinking toward the ocean. */
const RAW = {
  sand: { base: '#A8A38A', shade: '#8A866F', light: '#C4BFA3', line: '#3D3A2B' },
  rock: { base: '#5E6677', shade: '#464D5D', light: '#7B8394', line: '#1F232D' },
  brain: { base: '#C68F57', shade: '#9C6B39', light: '#DDAE7A', line: '#4A3016' },
  stag: { base: '#D9806E', shade: '#AF5C4F', light: '#EDA390', line: '#55241E' },
  finger: { base: '#D2B44A', shade: '#A88E2E', light: '#E8CE72', line: '#544410' },
  fan: { base: '#9461A6', shade: '#70467E', light: '#B688C3', line: '#371C40' },
  anemCol: { base: '#B8564E', shade: '#8C3C36', line: '#4A1A16' },
  anemTen: { base: '#C7D98A', shade: '#A0B562', tip: '#E89BBE', line: '#4C5A22' },
  star: { base: '#E27B3C', shade: '#B85C26', light: '#F2A066', line: '#5C2A0E', dot: '#F6C08E' },
  urchin: { base: '#3D2E4C', shade: '#2A1F36', light: '#6A5680', line: '#140E1A' },
  shell: { base: '#E4D2B8', shade: '#C0A88A', light: '#F4E8D6', line: '#5C4A34' },
  conch: { base: '#D8B08A', shade: '#B08A64', light: '#ECCCA8', line: '#5C3E22' },
  kelp: { base: '#7E8B3C', shade: '#5F6C29', light: '#A3B25C', line: '#2D3511', bladder: '#98A64C' },
  iron: { base: '#555D68', shade: '#3B424C', light: '#76808B', line: '#15191F', rust: '#8B5E3C' },
  horse: { base: '#E2A93E', shade: '#B9832A', light: '#F2C870', line: '#5A3C0E' },
  eye: '#0E1A14',
}
const OCEAN = '#1769C2'
const SINK: Readonly<Record<string, number>> = { fan: 0.3, sand: 0.08, shell: 0.08, conch: 0.08, eye: 0 }
/** Every decor tone pulled a little toward the ocean blue (the fan further), like the river's toward its green. */
const R = Object.fromEntries(Object.entries(RAW).map(([k, v]) => {
  const t = SINK[k] ?? 0.15
  if (typeof v === 'string') return [k, t ? mixOklab(v, OCEAN, t) : v] as const
  return [k, Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, mixOklab(vv, OCEAN, t)] as const))] as const
})) as typeof RAW
export type ReefPalette = typeof R

/** Bubble sources spread across the floor, each joining at its litre mark, like the river's. */
export const REEF_SOURCES: readonly BubbleSource[] = [
  { at: 1000, x: 149, y: 176, n: 3, seed: 3 },
  { at: 1500, x: 45, y: 140, n: 1, seed: 11 },
  { at: 2000, x: 86, y: 183, n: 2, seed: 7 },
  { at: 2500, x: 118, y: 194, n: 2, seed: 5 },
  { at: 3000, x: 22, y: 150, n: 1, seed: 13 },
]

type Draw = (scene: { ids: IdSpace; water: TubeWater }) => string
type ReefPiece = PieceSpec & { name: string; draw: Draw }

/**
 * Every reef piece in paint order with the ml at which it joins: the river's ladder, piece for piece.
 * `midTop` (mid-water pieces only) is the piece's top edge in scene px, measured from these coordinates.
 */
const PIECES: readonly ReefPiece[] = [
  { at: 2500, name: 'far-reef', draw: ({ water }) => farReef(water) },
  { at: 3000, midTop: 55, name: 'school', draw: ({ water }) => school(water) },
  { at: 2500, name: 'kelp', draw: ({ ids }) => kelp(ids, R) },
  { at: 1000, name: 'sand', draw: ({ ids }) => sand(ids, R) },
  { at: 1500, name: 'sea-fan', draw: ({ ids }) => seaFan(ids, R) },
  { at: 1000, name: 'rocks', draw: ({ ids }) => rocks(ids, R) },
  { at: 1000, name: 'brain-coral', draw: ({ ids }) => brainCoral(ids, R) },
  { at: 1000, name: 'finger-coral', draw: ({ ids }) => fingerCoral(ids, R) },
  { at: 1500, name: 'staghorn', draw: ({ ids }) => staghorn(ids, R) },
  { at: 2000, name: 'chain', draw: () => chain(R) },
  { at: 2000, name: 'anchor', draw: ({ ids }) => anchor(ids, R) },
  { at: 2000, name: 'anemone', draw: ({ ids }) => anemone(ids, R) },
  { at: 2000, name: 'shells', draw: ({ ids }) => shells(ids, R) },
  { at: 2000, name: 'urchin', draw: ({ ids }) => urchin(ids, R, 42, 196, 4.4) },
  { at: 2000, name: 'starfish', draw: ({ ids }) => starfish(ids, R, 64, 205.4, 7.4, 3, 14) },
  { at: 2500, name: 'seahorse', draw: ({ ids }) => seahorse(ids, R, 9, 98, 1.15) },
  { at: 3000, midTop: 117, name: 'jellyfish-1', draw: ({ water }) => jelly(62, 122, 1, -6, water) },
  { at: 3000, midTop: 91, name: 'jellyfish-2', draw: ({ water }) => jelly(94, 96, 0.82, 10, water) },
]

/**
 * The reef for a tube holding `ml` today, its water surface at `surfaceY` (scene px from the top): the
 * pieces' markup in paint order, each in a `<g data-piece>`, without the `<svg>` wrapper and the bubbles.
 */
export function reefScene(ml: number, water: TubeWater, surfaceY: number, ids: IdSpace): string {
  return PIECES.filter((p) => pieceVisible(p, ml, surfaceY))
    .map((p) => `<g data-piece="${p.name}">${p.draw({ ids, water })}</g>`)
    .join('')
}

/**
 * The chain alone, for the air above the water (it comes from a boat above, like the mangrove's tree).
 * Same arguments as `riverInAir`, so the tube can call either. The chain draws no clip ids and no
 * water-derived tones today, but the caller still gives it its own `IdSpace`, with a prefix distinct from
 * the scene's (the reference used `<prefix>r` for the scene and `<prefix>c` for the chain). Same piece name
 * as the underwater part, so both halves fade in together.
 */
export function reefInAir(ml: number, _water: TubeWater, _ids: IdSpace): string {
  if (ml < 2000) return ''
  return `<g data-piece="chain">${chain(R)}</g>`
}
