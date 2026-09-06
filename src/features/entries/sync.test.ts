import { describe, expect, it, vi } from 'vitest'
import type { Entry } from './cache'
import { runEntriesSync } from './sync'

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'e1',
    profile_id: 'u1',
    group_id: 'g1',
    total_ml: 500,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: '2026-09-01T12:00:00+00:00',
    drank_on: '2026-09-01',
    created_at: '2026-09-01T12:00:00+00:00',
    updated_at: '2026-09-01T12:00:00+00:00',
    deleted_at: null,
    ...overrides,
  }
}

describe('runEntriesSync', () => {
  it('fetches from the mirror watermark and merges, skipping queued ids', async () => {
    const prev = [
      makeEntry({ id: 'a', updated_at: '2026-09-05T10:00:00+00:00' }),
      makeEntry({ id: 'pending', updated_at: '', total_ml: 900 }),
    ]
    const fetchSince = vi.fn().mockResolvedValue([
      makeEntry({ id: 'b', drank_at: '2026-09-06T09:00:00+00:00', updated_at: '2026-09-06T09:00:01+00:00' }),
      makeEntry({ id: 'pending', total_ml: 100, updated_at: '2026-09-06T09:00:02+00:00' }),
    ])
    const merged = await runEntriesSync({
      groupId: 'g1',
      prev,
      queued: new Set(['pending']),
      fetchSince,
    })
    expect(fetchSince).toHaveBeenCalledWith('g1', '2026-09-05T10:00:00+00:00')
    expect(merged.find((e) => e.id === 'pending')?.total_ml).toBe(900)
    expect(merged.some((e) => e.id === 'b')).toBe(true)
  })

  it('passes undefined on first sync so everything is fetched', async () => {
    const fetchSince = vi.fn().mockResolvedValue([])
    await runEntriesSync({ groupId: 'g1', prev: [], queued: new Set(), fetchSince })
    expect(fetchSince).toHaveBeenCalledWith('g1', undefined)
  })
})
