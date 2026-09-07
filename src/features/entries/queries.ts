import { useEffect, useState, useSyncExternalStore } from 'react'
import { onlineManager, useQuery, useQueryClient } from '@tanstack/react-query'
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

const STALE_MS = 5 * 60_000

/** Pure core of the header pills: offline beats stale; stale = 5 min without a successful sync (spec §14). */
export function syncStatusOf(
  online: boolean,
  dataUpdatedAt: number,
  now: number,
): { offline: boolean; stale: boolean } {
  return {
    offline: !online,
    stale: online && dataUpdatedAt > 0 && now - dataUpdatedAt > STALE_MS,
  }
}

export function useSyncStatus(groupId: string | null | undefined): { offline: boolean; stale: boolean } {
  const online = useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  )
  const { dataUpdatedAt } = useEntries(groupId)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return syncStatusOf(online, dataUpdatedAt, now)
}
