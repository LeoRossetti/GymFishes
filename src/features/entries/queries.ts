import { useQuery } from '@tanstack/react-query'
import { fetchEntries } from './api'
import { entriesKey } from './cache'

export function useEntries(groupId: string | null | undefined) {
  return useQuery({
    queryKey: entriesKey(groupId ?? 'none'),
    enabled: Boolean(groupId),
    queryFn: () => fetchEntries(groupId!),
  })
}
