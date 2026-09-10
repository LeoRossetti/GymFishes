import { useNavigate, useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { fishOf } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { useGroupData } from '@/features/group/useGroupData'
import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'
import { ProgressStrip } from './ProgressStrip'
import { RegistersCard } from './RegistersCard'
import { SyncPill } from './SyncPill'

export function Hoje() {
  const { userId, groupId, members, entries } = useGroupData()
  const navigate = useNavigate()
  const { openRegister } = useOutletContext<ShellContext>()
  const me = members.find((m) => m.id === userId)

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
          className="flex min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <Fish variant={fishOf(me?.fish_variant ?? '')} size={36} state="still" />
        </button>
      </header>
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
