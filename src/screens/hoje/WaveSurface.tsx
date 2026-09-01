const BACK = 'M0 6 Q65 0 130 6 T260 6 T390 6 T520 6 T650 6 T780 6 V12 H0 Z'
const FRONT = 'M0 6 Q47.5 2 95 6 T190 6 T285 6 T380 6 T475 6 T570 6 T665 6 T760 6 V12 H0 Z'

/** The tube fill's top edge. Swap-in point for anything fancier later (spec §8). */
export function WaveSurface() {
  return (
    <>
      <div aria-hidden className="wave-static absolute inset-x-0 top-0" />
      <svg aria-hidden viewBox="0 0 780 12" className="wave-back absolute -top-[9px] left-0 h-3 w-[780px] fill-water-hi">
        <path d={BACK} />
      </svg>
      <svg aria-hidden viewBox="0 0 760 12" className="wave-front absolute -top-[6px] left-0 h-3 w-[760px] fill-water">
        <path d={FRONT} />
      </svg>
    </>
  )
}
