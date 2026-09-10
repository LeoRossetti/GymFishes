import type { FishId } from './catalog'
import { ART, type Tone } from './svg'

export type FishState = 'idle' | 'still' | 'locked'

type Props = { variant: FishId; size?: number; state?: FishState }

const VIEW_W = 64
const VIEW_H = 40

function tone(t: Tone): string {
  return `var(--color-${t})`
}

/**
 * Flat SVG fish (spec §6 "Art"), facing right in a 64×40 box. `idle` wags the tail and bobs via
 * CSS keyframes — paused by a `data-waves="paused"` ancestor like the water, off under
 * prefers-reduced-motion. `locked` is a one-colour silhouette. This is the swap point if a fish
 * ever becomes a Rive file: callers never see what is inside.
 */
export function Fish({ variant, size = 24, state = 'still' }: Props) {
  const art = ART[variant]
  const idle = state === 'idle'
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
      <g className={idle ? 'fish-bob' : undefined}>
        <path
          d={art.tail}
          fill={tone(art.colors.tail)}
          className={idle ? 'fish-tail' : undefined}
          style={{ transformOrigin: `${art.tailPivot[0]}px ${art.tailPivot[1]}px` }}
        />
        <path d={art.body} fill={tone(art.colors.body)} />
        {art.fins.map((d) => (
          <path key={d} d={d} fill={tone(art.colors.fins)} />
        ))}
        {art.marks.map((d) => (
          <path key={d} d={d} fill={tone(art.colors.marks)} />
        ))}
        {art.eyes.map(([cx, cy]) => (
          <g key={`${cx},${cy}`}>
            <circle cx={cx} cy={cy} r={2.4} fill="var(--color-ink)" />
            <circle cx={cx + 0.6} cy={cy} r={1.2} fill="var(--color-ink-on-water)" />
          </g>
        ))}
      </g>
    </svg>
  )
}
