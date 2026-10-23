import { useSyncStatus } from '@/features/entries/queries'
import { STRINGS } from '@/lib/strings'

/**
 * Yellow = attention without alarm; red stays reserved for delete (spec §8). Sits centred on its
 * own line under the screen title, the same 24px pill as the streak chip, so the centred title
 * never moves for it.
 */
export function SyncPill({ groupId }: { groupId: string | null | undefined }) {
  const { offline, stale } = useSyncStatus(groupId)
  if (!offline && !stale) return null
  return (
    <span
      role="status"
      className="inline-flex h-6 shrink-0 items-center rounded-[99px] border border-streak px-2.5 text-[12px] font-extrabold text-streak"
    >
      {offline ? STRINGS.erro.semConexao : STRINGS.sync.desatualizado}
    </span>
  )
}
