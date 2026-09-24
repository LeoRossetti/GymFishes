import { fillStep, monthCells, type FillStep } from '@/lib/calendar'
import { parseDayKey, type DayKey } from '@/lib/dates'
import { formatDayLong, formatVolume } from '@/lib/format'
import type { Period } from '@/lib/periods'
import { STRINGS } from '@/lib/strings'

type Props = {
  period: Period
  totals: ReadonlyMap<DayKey, number>
  today: DayKey
  firstDay: DayKey | undefined
  selected: DayKey | null
  onSelect: (day: DayKey) => void
}

/** Five flat steps of the water token — discrete, never a gradient (spec §5.4). */
const FILL: Record<FillStep, string> = {
  0: 'bg-surface-2 text-ink',
  1: 'bg-water/25 text-ink',
  2: 'bg-water/50 text-ink',
  3: 'bg-water/75 text-ink-on-water',
  4: 'bg-water text-ink-on-water',
}

export function CalendarGrid({ period, totals, today, firstDay, selected, onSelect }: Props) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {STRINGS.historico.diasSemana.map((d, i) => (
        <span key={i} className="text-center text-[10px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {d}
        </span>
      ))}
      {monthCells(period).map((day, i) => {
        if (!day) return <span key={`blank-${i}`} />
        const blank = firstDay === undefined || day < firstDay || day > today
        const total = totals.get(day) ?? 0
        const step = fillStep(total)
        const border =
          day === selected ? 'border-2 border-ink' : day === today ? 'border border-water' : 'border border-transparent'
        // press feedback never inverts a filled surface: only steps 0–2 get it (spec §8).
        const feedback = step <= 2 ? 'active:bg-line transition-colors duration-100' : ''
        return (
          <button
            key={day}
            type="button"
            disabled={blank}
            aria-label={STRINGS.historico.diaComTotal(
              formatDayLong(day),
              total > 0 ? formatVolume(total) : STRINGS.historico.semRegistro,
            )}
            aria-pressed={day === selected}
            data-step={blank ? undefined : step}
            onClick={() => onSelect(day)}
            className={`flex min-h-[44px] items-center justify-center rounded-key text-[13px] font-bold ${feedback} ${border} ${
              blank ? 'text-ink-3' : FILL[step]
            }`}
          >
            {parseDayKey(day).d}
          </button>
        )
      })}
    </div>
  )
}
