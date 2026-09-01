import { useNavigate } from 'react-router'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { useMembers } from '@/features/group/queries'
import { useEntries } from '@/features/entries/queries'
import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'
import { ProgressStrip } from './ProgressStrip'

export function Hoje() {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const groupId = bootstrap.data?.groupId
  const members = useMembers(groupId)
  const entries = useEntries(groupId)
  const navigate = useNavigate()

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 flex items-start justify-between px-1">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.hoje.titulo}</h1>
          <p className="mt-1 text-[10px] text-ink-3">{formatDateLong(new Date())}</p>
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
      <div className="mt-3 rounded-card border border-line bg-surface p-5 text-center">
        <p className="text-[13px] text-ink-2">{STRINGS.hoje.vazio}</p>
      </div>
    </div>
  )
}
