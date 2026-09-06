import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { entriesKey, upsertEntry, type Entry } from './cache'
import { outboxStore } from './outboxStore'

/**
 * Realtime is an accelerator, never the source of truth (spec §12) —
 * the watermark sync in sync.ts/queries.ts is what guarantees correctness if a socket drops.
 */
export function useRealtimeEntries(groupId: string | null | undefined) {
  const client = useQueryClient()
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`entries-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries', filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as Partial<Entry>
          if (!row || typeof row.id !== 'string') return
          // a queued local op owns this row's optimistic state; the post-flush sync will reconcile
          if (outboxStore.getStatus().queued.has(row.id)) return
          const key = entriesKey(groupId)
          const list = client.getQueryData<Entry[]>(key) ?? []
          client.setQueryData(key, upsertEntry(list, row as Entry))
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [groupId, client])
}
