import type { Entry } from '@/features/entries/cache'
import { useEntryOps } from '@/features/entries/mutations'
import { useOutboxStatus } from '@/features/entries/outboxStore'
import type { Member } from '@/features/group/queries'
import { memberName } from '@/features/group/useGroupData'
import { EntryRow } from './EntryRow'

type Props = {
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
  empty: string
}

/** The compact register list from Hoje, reused by Histórico's day detail (spec §5.4). */
export function EntryList({ userId, groupId, members, entries, openRegister, empty }: Props) {
  const ops = useEntryOps(groupId, userId)
  const status = useOutboxStatus()

  if (entries.length === 0) {
    return <p className="py-4 text-center text-[13px] text-ink-2">{empty}</p>
  }
  return (
    <ul>
      {entries.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          authorName={memberName(members, userId, entry.profile_id)}
          isOwn={entry.profile_id === userId}
          pending={status.pending.has(entry.id)}
          failed={status.failed.has(entry.id)}
          onEdit={() => openRegister(entry)}
          onDelete={() => ops.remove(entry)}
          onRetry={() => ops.retry(entry.id)}
        />
      ))}
    </ul>
  )
}
