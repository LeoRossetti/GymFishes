import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export async function uploadEntryPhoto(
  groupId: string,
  profileId: string,
  entryId: string,
  photo: Blob,
  thumb: Blob,
): Promise<{ photoPath: string; thumbPath: string }> {
  const base = `${groupId}/${profileId}/${entryId}`
  const opts = { contentType: 'image/jpeg', upsert: true }
  const photoPath = `${base}.jpg`
  const thumbPath = `${base}_thumb.jpg`
  const p = await supabase.storage.from('photos').upload(photoPath, photo, opts)
  if (p.error) throw p.error
  const t = await supabase.storage.from('photos').upload(thumbPath, thumb, opts)
  if (t.error) throw t.error
  return { photoPath, thumbPath }
}

/** Best-effort: an orphaned object costs nothing (spec §13 step 7). Never throws. */
export function removeEntryPhotos(paths: readonly (string | null)[]): void {
  const found = paths.filter((p): p is string => Boolean(p))
  if (found.length === 0) return
  void supabase.storage
    .from('photos')
    .remove(found)
    .catch(() => {})
}

export function useSignedUrl(path: string | null) {
  return useQuery({
    queryKey: ['signed-url', path],
    enabled: Boolean(path),
    staleTime: 55 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('photos').createSignedUrl(path!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}
