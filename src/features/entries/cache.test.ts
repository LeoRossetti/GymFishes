import { describe, expect, it } from 'vitest'
import { mergeEntries, removeEntry, upsertEntry, watermarkOf, type Entry } from './cache'

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

describe('upsertEntry', () => {
  it('inserts keeping newest-first by drank_at, across ISO formats', () => {
    const a = makeEntry({ id: 'a', drank_at: '2026-09-01T10:00:00+00:00' })
    const b = makeEntry({ id: 'b', drank_at: '2026-09-01T12:00:00.000Z' })
    expect(upsertEntry([a], b).map((e) => e.id)).toEqual(['b', 'a'])
    expect(upsertEntry([b], a).map((e) => e.id)).toEqual(['b', 'a'])
  })
  it('replaces an existing row by id', () => {
    const a = makeEntry({ id: 'a', total_ml: 500 })
    const list = upsertEntry([a], makeEntry({ id: 'a', total_ml: 700 }))
    expect(list).toHaveLength(1)
    expect(list[0]?.total_ml).toBe(700)
  })
  it('drops soft-deleted rows', () => {
    const a = makeEntry({ id: 'a' })
    expect(upsertEntry([a], makeEntry({ id: 'a', deleted_at: '2026-09-01T13:00:00Z' }))).toEqual([])
  })
})

describe('removeEntry', () => {
  it('removes by id', () => {
    expect(removeEntry([makeEntry({ id: 'a' })], 'a')).toEqual([])
  })
})

describe('watermarkOf', () => {
  it('returns the max updated_at, ignoring optimistic rows (empty updated_at)', () => {
    const list = [
      makeEntry({ id: 'a', updated_at: '2026-09-05T10:00:00.2+00:00' }),
      makeEntry({ id: 'b', updated_at: '2026-09-05T10:00:00.11+00:00' }),
      makeEntry({ id: 'c', updated_at: '' }),
    ]
    expect(watermarkOf(list)).toBe('2026-09-05T10:00:00.2+00:00')
  })
  it('is undefined for an empty or all-optimistic mirror', () => {
    expect(watermarkOf([])).toBeUndefined()
    expect(watermarkOf([makeEntry({ updated_at: '' })])).toBeUndefined()
  })
})

describe('mergeEntries', () => {
  it('upserts server rows, drops soft-deleted, keeps newest-first by drank_at', () => {
    const prev = [makeEntry({ id: 'a', drank_at: '2026-09-01T12:00:00+00:00' })]
    const rows = [
      makeEntry({ id: 'b', drank_at: '2026-09-02T12:00:00+00:00' }),
      makeEntry({ id: 'a', deleted_at: '2026-09-02T13:00:00+00:00' }),
    ]
    expect(mergeEntries(prev, rows, new Set()).map((e) => e.id)).toEqual(['b'])
  })
  it('rows with a queued op keep their optimistic state', () => {
    const prev = [makeEntry({ id: 'a', total_ml: 900, updated_at: '' })]
    const rows = [makeEntry({ id: 'a', total_ml: 500 })]
    expect(mergeEntries(prev, rows, new Set(['a']))[0]?.total_ml).toBe(900)
  })
})
