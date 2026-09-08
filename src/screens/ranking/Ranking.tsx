import { useState } from 'react'
import { useGroupData } from '@/features/group/useGroupData'
import { statsFor, type MemberStats } from '@/lib/averages'
import { dayKey } from '@/lib/dates'
import { allPeriod, dayPeriod, type Period } from '@/lib/periods'
import { firstRegisterDay, standings, totalsForPeriod } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { MonthWrapUp } from './MonthWrapUp'
import { PeriodControl } from './PeriodControl'
import { Standings } from './Standings'
import { StatsCompare } from './StatsCompare'

/** Answers "who is winning" and nothing else (spec §5.3). Everything is derived from the mirror. */
export function Ranking() {
  const { userId, members, entries } = useGroupData()
  const today = dayKey(new Date())
  const [period, setPeriod] = useState<Period>(() => dayPeriod(today))
  if (!userId) return null

  const firstDay = firstRegisterDay(entries) ?? today
  const shown = period.kind === 'all' ? allPeriod(firstDay, today) : period
  const ids = members.map((m) => m.id)
  const rows = standings(totalsForPeriod(entries, shown), ids)
  const stats = new Map<string, MemberStats>(
    ids.map((id): [string, MemberStats] => [id, statsFor(entries, shown, today, id)]),
  )

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.ranking.titulo}</h1>
      </header>
      <MonthWrapUp entries={entries} members={members} userId={userId} today={today} />
      <section className="rounded-card border border-line bg-surface p-4">
        <PeriodControl period={shown} today={today} firstDay={firstDay} onChange={setPeriod} />
        <Standings rows={rows} members={members} userId={userId} />
      </section>
      <StatsCompare members={members} userId={userId} stats={stats} />
    </div>
  )
}
