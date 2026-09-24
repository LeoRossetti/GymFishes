const BACK = 'M0 8 Q65 0 130 8 T260 8 T390 8 T520 8 T650 8 T780 8 V14 H0 Z'
const FRONT = 'M0 8 Q47.5 2 95 8 T190 8 T285 8 T380 8 T475 8 T570 8 T665 8 T760 8 V14 H0 Z'

/** The tube fill's top edge (spec §8 + M7 §8.2: 4px / 3px crests). Swap-in point for anything fancier later. */
export function WaveSurface() {
  return (
    <>
      <div aria-hidden className="wave-static absolute inset-x-0 top-0" />
      <svg aria-hidden viewBox="0 0 780 14" className="wave-back absolute -top-[11px] left-0 h-[14px] w-[780px] fill-water-hi">
        <path d={BACK} />
      </svg>
      <svg aria-hidden viewBox="0 0 760 14" className="wave-front absolute -top-[8px] left-0 h-[14px] w-[760px] fill-water">
        <path d={FRONT} />
      </svg>
    </>
  )
}
