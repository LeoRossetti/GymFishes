import { describe, expect, it } from 'vitest'
import { totalsForDay } from './rankings'

const e = (profile_id: string, total_ml: number, drank_on: string, deleted_at: string | null = null) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at,
})

describe('totalsForDay', () => {
  it('sums per member for the given day only', () => {
    const totals = totalsForDay(
      [e('a', 500, '2026-09-01'), e('a', 300, '2026-09-01'), e('a', 900, '2026-08-31'), e('b', 250, '2026-09-01')],
      '2026-09-01',
    )
    expect(totals.get('a')).toBe(800)
    expect(totals.get('b')).toBe(250)
  })
  it('ignores soft-deleted entries', () => {
    const totals = totalsForDay([e('a', 500, '2026-09-01', '2026-09-01T13:00:00Z')], '2026-09-01')
    expect(totals.get('a')).toBeUndefined()
  })
})
