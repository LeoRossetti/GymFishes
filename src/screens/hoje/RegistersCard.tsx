import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
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

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.hoje.registrosDeHoje} · {todays.length}
      </h2>
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
