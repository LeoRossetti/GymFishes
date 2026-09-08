import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { memberName, selfFirst } from '@/features/group/useGroupData'
import type { DayKey } from '@/lib/dates'
import { formatDayLong, formatVolume } from '@/lib/format'
import { totalsForDay } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { EntryList } from '@/screens/hoje/EntryList'

type Props = {
  day: DayKey
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
}

/** Both members' totals for the day plus the full register list, reusing Hoje's rows (spec §5.4). */
export function DayDetail({ day, userId, groupId, members, entries, openRegister }: Props) {
  const rows = entries.filter((e) => e.drank_on === day)
  const totals = totalsForDay(entries, day)
  const summary = selfFirst(members, userId)
    .map((m) => `${memberName(members, userId, m.id)} ${formatVolume(totals.get(m.id) ?? 0)}`)
    .join(' · ')

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">{formatDayLong(day)}</h2>
      <p className="mt-1 mb-2 text-[13px] font-bold text-ink-2">{summary}</p>
      <EntryList
        userId={userId}
        groupId={groupId}
        members={members}
        entries={rows}
        openRegister={openRegister}
        empty={STRINGS.historico.nenhumRegistro}
      />
    </section>
  )
}
