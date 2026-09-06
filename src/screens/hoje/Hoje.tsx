import { useNavigate, useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { useMembers } from '@/features/group/queries'
import { useEntries } from '@/features/entries/queries'
import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'
import { ProgressStrip } from './ProgressStrip'
import { RegistersCard } from './RegistersCard'
import { SyncPill } from './SyncPill'

export function Hoje() {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const groupId = bootstrap.data?.groupId
  const members = useMembers(groupId)
  const entries = useEntries(groupId)
  const navigate = useNavigate()
  const { openRegister } = useOutletContext<ShellContext>()

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 flex items-start justify-between px-1">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.hoje.titulo}</h1>
          <p className="mt-1 text-[10px] text-ink-3">{formatDateLong(new Date())}</p>
          <SyncPill groupId={groupId} />
        </div>
        <button
          type="button"
          aria-label={STRINGS.hoje.abrirPerfil}
          onClick={() => navigate('/perfil')}
          className="min-h-[44px] min-w-[44px] text-[24px]"
        >
          🐟
        </button>
      </header>
      {userId ? (
        <ProgressStrip userId={userId} members={members.data ?? []} entries={entries.data ?? []} />
      ) : null}
      {userId && groupId ? (
        <RegistersCard
          userId={userId}
          groupId={groupId}
          members={members.data ?? []}
          entries={entries.data ?? []}
          openRegister={openRegister}
        />
      ) : null}
    </div>
  )
}
