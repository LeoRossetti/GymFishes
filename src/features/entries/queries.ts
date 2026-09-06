import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEntriesSince } from './api'
import { entriesKey, type Entry } from './cache'
import { outboxStore } from './outboxStore'
import { runEntriesSync } from './sync'

/**
 * The queryFn IS the incremental sync: TanStack's mount/focus/reconnect refetching
 * gives us the spec §12 read triggers, and merging (never replacing) means optimistic
 * outbox rows survive every refetch.
 */
export function useEntries(groupId: string | null | undefined) {
  const client = useQueryClient()
  return useQuery({
    queryKey: entriesKey(groupId ?? 'none'),
    enabled: Boolean(groupId),
    queryFn: async () => {
      await outboxStore.ready()
      return runEntriesSync({
        groupId: groupId!,
        prev: client.getQueryData<Entry[]>(entriesKey(groupId!)) ?? [],
        queued: outboxStore.getStatus().queued,
        fetchSince: fetchEntriesSince,
      })
    },
  })
}
