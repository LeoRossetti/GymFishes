import { FISH_IDS, type FishId } from '@/features/fish/catalog'

export const SEEN_UNLOCKS_KEY = 'gymfishes:seen_unlocks'

function isFishId(v: unknown): v is FishId {
  return typeof v === 'string' && (FISH_IDS as readonly string[]).includes(v)
}

/** Fish already celebrated on this device; null when this device never recorded any (spec §6). */
export function loadSeenUnlocks(): Set<FishId> | null {
  try {
    const raw = localStorage.getItem(SEEN_UNLOCKS_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter(isFishId) : [])
  } catch {
    return null
  }
}

export function saveSeenUnlocks(seen: ReadonlySet<FishId>): void {
  try {
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify([...seen]))
  } catch {
    // storage blocked (private mode): the same fish may be celebrated again next time — harmless
  }
}
