import { useState } from 'react'
import { useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { memberName, selfFirst, useGroupData } from '@/features/group/useGroupData'
import { statsFor } from '@/lib/averages'
import { dayKey, type DayKey } from '@/lib/dates'
import { formatMonthTitle, formatVolume } from '@/lib/format'
import { containsDay, monthPeriod, stepPeriod, type Period } from '@/lib/periods'
import { firstRegisterDay, totalsByDay } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'
import { CalendarGrid } from './CalendarGrid'
import { DayDetail } from './DayDetail'

/** Answers "what happened before" (spec §5.4): one member's month at a glance, any day in detail. */
export function Historico() {
  const { userId, groupId, members, entries } = useGroupData()
  const { openRegister } = useOutletContext<ShellContext>()
  const today = dayKey(new Date())
  const [memberId, setMemberId] = useState<string | null>(null)
  const [month, setMonth] = useState<Period>(() => monthPeriod(today))
  const [selected, setSelected] = useState<DayKey | null>(null)
  if (!userId || !groupId) return null

  const shown = memberId ?? userId
  const stats = statsFor(entries, month, today, shown)
  const title = formatMonthTitle(month.start, today)

  function goToMonth(delta: -1 | 1) {
    setMonth(stepPeriod(month, delta))
    setSelected(null)
  }

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.historico.titulo}</h1>
      </header>
      <section className="rounded-card border border-line bg-surface p-4">
        <Segmented
          label={STRINGS.historico.membro}
          options={selfFirst(members, userId).map((m) => ({
            value: m.id,
            label: memberName(members, userId, m.id),
          }))}
          value={shown}
          onChange={setMemberId}
        />
        <div className="mt-3">
          <Stepper
            label={title}
            prevLabel={STRINGS.historico.mesAnterior}
            nextLabel={STRINGS.historico.proximoMes}
            nextDisabled={containsDay(month, today)}
            onPrev={() => goToMonth(-1)}
            onNext={() => goToMonth(1)}
          />
        </div>
        <CalendarGrid
          period={month}
          totals={totalsByDay(entries, month, shown)}
          today={today}
          firstDay={firstRegisterDay(entries)}
          selected={selected}
          onSelect={setSelected}
        />
        <p className="mt-3 text-center text-[13px] font-bold text-ink-2">
          {STRINGS.historico.rodape(
            title,
            formatVolume(stats.totalMl),
            formatVolume(stats.averageMl),
            STRINGS.ranking.de(stats.daysRegistered, stats.daysElapsed),
          )}
        </p>
      </section>
      {selected ? (
        <DayDetail
          day={selected}
          userId={userId}
          groupId={groupId}
          members={members}
          entries={entries}
          openRegister={openRegister}
        />
      ) : null}
    </div>
  )
}
