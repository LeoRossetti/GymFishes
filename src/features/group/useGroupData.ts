import { useSession } from '@/features/auth/AuthProvider'
import type { Entry } from '@/features/entries/cache'
import { useEntries } from '@/features/entries/queries'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { STRINGS } from '@/lib/strings'
import { useMembers, type Member } from './queries'

const NO_MEMBERS: Member[] = []
const NO_ENTRIES: Entry[] = []

export type GroupData = {
  userId: string | undefined
  groupId: string | null | undefined
  members: Member[]
  entries: Entry[]
}

/** The chain every tab needs: who am I → which group → who's in it → what they drank. */
export function useGroupData(): GroupData {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const groupId = bootstrap.data?.groupId
  const members = useMembers(groupId)
  const entries = useEntries(groupId)
  return {
    userId,
    groupId,
    members: members.data ?? NO_MEMBERS,
    entries: entries.data ?? NO_ENTRIES,
  }
}

/** "Você" always comes first in any member list (spec §5.1, §5.3, §5.4). */
export function selfFirst(members: readonly Member[], userId: string): Member[] {
  return [...members].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
}

/** "Você" for me, the display name for anyone else in the roster, "Alguém" for a stranger. */
export function memberName(members: readonly Member[], userId: string, id: string): string {
  if (id === userId) return STRINGS.hoje.voce
  return members.find((m) => m.id === id)?.display_name ?? STRINGS.hoje.alguem
}
