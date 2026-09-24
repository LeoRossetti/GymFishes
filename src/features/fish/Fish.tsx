import { useId } from 'react'
import type { FishId } from './catalog'
import { ART } from './svg'
import { VIEW_H, VIEW_W, type Layer } from './svg/types'

export type FishState = 'idle' | 'still' | 'locked'

type Props = { variant: FishId; size?: number; state?: FishState }

function LayerPath({ layer, clipId }: { layer: Layer; clipId: string }) {
  return (
    <path
      d={layer.d}
      fill={layer.fill}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      clipPath={layer.clip ? `url(#${clipId})` : undefined}
    />
  )
}

/**
 * A layered flat illustration of the species (spec M7 §9), facing right. `idle` wags the tail
 * group and bobs via CSS keyframes — paused by a `data-waves="paused"` ancestor like the water,
 * off under prefers-reduced-motion. `locked` paints every layer `--ink-3` with no stroke: a
 * one-colour silhouette. This is the swap point if a fish ever becomes a Rive file.
 */
export function Fish({ variant, size = 24, state = 'still' }: Props) {
  const art = ART[variant]
  const idle = state === 'idle'
  const clipId = `fish-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={(size * VIEW_H) / VIEW_W}
      aria-hidden
      data-fish={variant}
      data-state={state}
      className={state === 'locked' ? 'fish-locked block' : 'block'}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={art.body} />
        </clipPath>
      </defs>
      <g className={idle ? 'fish-bob' : undefined}>
        <g
          className={idle ? 'fish-tail' : undefined}
          style={{ transformOrigin: `${art.tailPivot[0]}px ${art.tailPivot[1]}px` }}
        >
          {art.tail.map((layer, i) => (
            <LayerPath key={i} layer={layer} clipId={clipId} />
          ))}
        </g>
        {art.layers.map((layer, i) => (
          <LayerPath key={i} layer={layer} clipId={clipId} />
        ))}
        {/* Eyes are fixed hex like the species palettes: fish do not follow the theme (spec M7 §7.5). */}
        {art.eyes.map((e) => (
          <g key={`${e.cx},${e.cy}`}>
            <circle cx={e.cx} cy={e.cy} r={e.r} fill="#F2F7FB" />
            <circle cx={e.cx + e.r * 0.2} cy={e.cy} r={e.r * 0.58} fill="#072536" />
            <circle cx={e.cx + e.r * 0.45} cy={e.cy - e.r * 0.35} r={e.r * 0.18} fill="#F2F7FB" />
          </g>
        ))}
      </g>
    </svg>
  )
}
