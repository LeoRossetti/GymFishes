import type { DayKey } from '@/lib/dates'
import { formatPeriodLabel } from '@/lib/format'
import { containsDay, currentPeriod, stepPeriod, type Period, type PeriodKind } from '@/lib/periods'
import { STRINGS } from '@/lib/strings'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'

const KINDS: readonly PeriodKind[] = ['day', 'week', 'month', 'all']

type Props = {
  period: Period
  today: DayKey
  firstDay: DayKey
  onChange: (period: Period) => void
}

/** `Hoje | Semana | Mês | Total` plus `‹ ›` (spec §5.3). Forward never passes today; Total has no arrows. */
export function PeriodControl({ period, today, firstDay, onChange }: Props) {
  const label = formatPeriodLabel(period, today)
  return (
    <div>
      <Segmented
        label={STRINGS.ranking.periodo}
        options={KINDS.map((k) => ({ value: k, label: STRINGS.ranking.periodos[k] }))}
        value={period.kind}
        onChange={(kind) => onChange(currentPeriod(kind, today, firstDay))}
      />
      <div className="mt-3">
        {period.kind === 'all' ? (
          <p className="flex min-h-[44px] items-center justify-center text-[15px] font-bold">{label}</p>
        ) : (
          <Stepper
            label={label}
            prevLabel={STRINGS.ranking.anterior}
            nextLabel={STRINGS.ranking.proximo}
            nextDisabled={containsDay(period, today)}
            onPrev={() => onChange(stepPeriod(period, -1))}
            onNext={() => onChange(stepPeriod(period, 1))}
          />
        )}
      </div>
    </div>
  )
}
