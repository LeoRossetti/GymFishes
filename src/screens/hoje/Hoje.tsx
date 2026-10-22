import { useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { useGroupData } from '@/features/group/useGroupData'
import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'
import { ScreenHeader } from '@/ui/ScreenHeader'
import { ProgressStrip } from './ProgressStrip'
import { RegistersCard } from './RegistersCard'
import { SyncPill } from './SyncPill'

export function Hoje() {
  const { userId, groupId, members, entries } = useGroupData()
  const { openRegister } = useOutletContext<ShellContext>()

  return (
    <div className="px-3 pt-2">
      <ScreenHeader
        title={STRINGS.hoje.titulo}
        subtitle={formatDateLong(new Date())}
        status={<SyncPill groupId={groupId} />}
      />
      {userId ? <ProgressStrip userId={userId} members={members} entries={entries} /> : null}
      {userId && groupId ? (
        <RegistersCard
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
