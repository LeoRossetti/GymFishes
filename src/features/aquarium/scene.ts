// One tube's aquarium markup: the scene under the water, the air above it, and the bubbles' keyframes.
// Memoized, so re-renders never rebuild paths.
import type { Habitat } from '../fish/catalog'
import { reefInAir, reefScene, REEF_SOURCES } from './art/reef'
import { idSpace } from './art/prims'
import { riverInAir, riverScene, RIVER_SOURCES } from './art/river'
import { bubbleField } from './bubbles'
import { tubeWater, type TubeWater } from './color'
import { surfaceYOf } from './ladder'

export type SceneMarkup = { water: TubeWater; scene: string; air: string; css: string }

const CACHE_SIZE = 16
const cache = new Map<string, SceneMarkup>()

/**
 * The markup for a tube holding `ml` of `scaleMl`. The scene and the air get distinct id spaces (both can
 * draw clipped pieces), and `prefix` keeps ids and keyframe names unique per tube.
 */
export function buildScene(habitat: Habitat, ml: number, scaleMl: number, start: TubeWater, prefix: string): SceneMarkup {
  const key = JSON.stringify([habitat, ml, scaleMl, start.fill, start.hi, prefix])
  const hit = cache.get(key)
  if (hit) return hit

  const water = tubeWater(ml, habitat, start)
  const surfaceY = surfaceYOf(ml, scaleMl)
  const river = habitat === 'fresh'
  const pieces = river
    ? riverScene(ml, water, surfaceY, idSpace(prefix + 'f'))
    : reefScene(ml, water, surfaceY, idSpace(prefix + 'r'))
  const air = river ? riverInAir(ml, water, idSpace(prefix + 'a')) : reefInAir(ml, water, idSpace(prefix + 'c'))
  const bubbles = bubbleField(ml, water, surfaceY, river ? RIVER_SOURCES : REEF_SOURCES, prefix)

  const built: SceneMarkup = { water, scene: pieces + bubbles.svg, air, css: bubbles.css }
  cache.set(key, built)
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string)
  return built
}
