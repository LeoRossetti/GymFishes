type Props = {
  label: string
  prevLabel: string
  nextLabel: string
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

const ARROW = 'min-h-[44px] min-w-[44px] text-[24px] font-extrabold text-ink-2 disabled:opacity-40'

/** `‹ label ›` — the period and month steppers (spec §5.3, §5.4). */
export function Stepper({ label, prevLabel, nextLabel, nextDisabled, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" aria-label={prevLabel} onClick={onPrev} className={ARROW}>
        ‹
      </button>
      <p className="text-[15px] font-bold">{label}</p>
      <button type="button" aria-label={nextLabel} onClick={onNext} disabled={nextDisabled} className={ARROW}>
        ›
      </button>
    </div>
  )
}
