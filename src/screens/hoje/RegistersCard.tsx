import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { registeredDays, streakOf } from '@/lib/streaks'
import { STRINGS } from '@/lib/strings'
import { Flame } from '@/ui/icons'
import { EntryList } from './EntryList'

type Props = {
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
}

export function RegistersCard({ userId, groupId, members, entries, openRegister }: Props) {
  const today = dayKey(new Date())
  const todays = entries.filter((e) => e.drank_on === today)
  const streak = streakOf(registeredDays(entries, userId), today)

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {STRINGS.hoje.registrosDeHoje} · {todays.length}
        </h2>
        {streak.days > 0 ? (
          <span
            className={`inline-flex h-6 items-center gap-1 rounded-[99px] border border-streak px-2.5 text-[12px] font-extrabold text-streak ${
              streak.atRisk ? 'opacity-50' : ''
            }`}
          >
            <Flame size={14} />
            {STRINGS.hoje.streak(streak.days)}
          </span>
        ) : null}
      </div>
      <EntryList
        userId={userId}
        groupId={groupId}
        members={members}
        entries={todays}
        openRegister={openRegister}
        empty={STRINGS.hoje.vazio}
      />
    </section>
  )
}
