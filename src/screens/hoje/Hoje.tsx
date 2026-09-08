import { useNavigate, useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
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
