// The living river or reef in one tube (M10 aquarium spec §3). MemberTube renders it inside the water's box,
// after the crest and before the fish, and puts the mixed water on the tube's root with `waterVars`.
import { useId, useMemo, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import { habitatOf, type FishId, type Habitat } from '@/features/fish/catalog'
import { readStoredTheme } from '@/features/theme/theme'
import { THEMES } from '@/features/theme/themes'
import type { TubeWater } from './color'
import { SCENE_H, SCENE_W } from './ladder'
import { buildScene, type SceneMarkup } from './scene'
import { useTubeStyle } from './useTubeStyle'

type Props = { habitat: Habitat; markup: SceneMarkup; prefix: string }

/** Where the colour shift starts: the active theme's water, read once per tube. */
function themeWater(): TubeWater {
  const t = THEMES[readStoredTheme()]
  return { fill: t.water, hi: t.waterHi }
}

/** The tube's aquarium under "Com cenário"; null under "Só água", which keeps today's plain tube. */
export function useAquarium(fish: FishId, ml: number, scaleMl: number): Props | null {
  const { style } = useTubeStyle()
  // unique per tube, and a valid CSS and SVG name (it prefixes ids, keyframes and the fade scope)
  const prefix = `aq${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [start] = useState(themeWater)
  if (style === 'agua') return null
  const habitat = habitatOf(fish)
  return { habitat, prefix, markup: buildScene(habitat, ml, scaleMl, start, prefix) }
}

/** For the tube's root: the water body, the crest and the reduced-motion band inside it take the mix. */
export function waterVars(water: TubeWater): CSSProperties {
  return { '--color-water': water.fill, '--color-water-hi': water.hi } as CSSProperties
}

const pieceNames = (m: SceneMarkup): readonly string[] => [
  ...new Set(Array.from((m.scene + m.air).matchAll(/data-piece="([^"]+)"/g), (x) => x[1] ?? '')),
]

const fadeCss = (prefix: string, fresh: readonly string[]) =>
  fresh.length ? `${fresh.map((n) => `.${prefix} [data-piece="${n}"]`).join(',')}{animation:aq-fade 400ms ease-out}` : ''

/** The 156 × 216 drawing at the tube's full inner height, squeezed (never stretched up) to its width. */
const BOX = { viewBox: `0 0 ${SCENE_W} ${SCENE_H}`, preserveAspectRatio: 'none', width: '100%', height: SCENE_H } as const

/**
 * Two layers, both the tube's inner box anchored to the floor. The scene is clipped to the water and paints
 * above the crest. The air holds the roots or the chain, clipped to the tube above the surface plus 1,5 px of
 * overlap, so no seam shows. Pieces a drink brings fade in; none on the first render or under reduced motion,
 * which also leaves the bubbles out.
 */
export function Aquarium({ habitat, markup, prefix }: Props) {
  const reduced = useReducedMotion() === true
  const names = useMemo(() => pieceNames(markup), [markup])
  const [fade, setFade] = useState({ names, fresh: [] as readonly string[] })
  if (fade.names !== names) {
    setFade({ names, fresh: reduced ? [] : names.filter((n) => !fade.names.includes(n)) })
  }
  // The markup is built from the committed art and numbers only, never from user data. The objects are
  // stable: a new __html object would make React rewrite the markup on every render.
  const scene = useMemo(() => ({ __html: reduced ? markup.scene : markup.scene + markup.bubbles }), [markup, reduced])
  const air = useMemo(() => ({ __html: markup.air }), [markup])
  const css = reduced ? '' : markup.css + fadeCss(prefix, fade.fresh)

  return (
    <>
      {css ? <style>{css}</style> : null}
      <div aria-hidden data-aquarium={habitat} className={`${prefix} absolute inset-0 overflow-hidden`}>
        <svg {...BOX} className="absolute bottom-0 left-0" dangerouslySetInnerHTML={scene} />
      </div>
      {markup.air ? (
        <div
          aria-hidden
          className={`${prefix} absolute inset-x-0 overflow-hidden`}
          style={{ top: `calc(100% - ${SCENE_H}px)`, bottom: 'calc(100% - 1.5px)' }}
        >
          <svg {...BOX} className="absolute left-0 top-0" dangerouslySetInnerHTML={air} />
        </div>
      ) : null}
    </>
  )
}
