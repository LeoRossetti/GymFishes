import { useSyncStatus } from '@/features/entries/queries'
import { STRINGS } from '@/lib/strings'

/** Yellow = attention without alarm; red stays reserved for delete (spec §8). */
export function SyncPill({ groupId }: { groupId: string | null | undefined }) {
  const { offline, stale } = useSyncStatus(groupId)
  if (!offline && !stale) return null
  return (
    <span className="mt-1 inline-block rounded-[99px] border border-streak px-3 py-1 text-[11px] font-bold text-streak">
      {offline ? STRINGS.erro.semConexao : STRINGS.sync.desatualizado}
    </span>
  )
}
