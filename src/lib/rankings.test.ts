import { describe, expect, it } from 'vitest'
import { monthPeriod, weekPeriod } from './periods'
import { dayTotals, firstRegisterDay, standings, totalsByDay, totalsForDay, totalsForPeriod } from './rankings'

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

describe('totalsForPeriod', () => {
  it('sums per member inside the period, ignoring outside days and deleted rows', () => {
    const week = weekPeriod('2026-08-10')
    const totals = totalsForPeriod(
      [
        e('a', 500, '2026-08-10'),
        e('a', 300, '2026-08-16'),
        e('a', 900, '2026-08-09'),
        e('b', 250, '2026-08-12'),
        e('b', 999, '2026-08-12', '2026-08-12T13:00:00Z'),
      ],
      week,
    )
    expect(totals.get('a')).toBe(800)
    expect(totals.get('b')).toBe(250)
  })
})

describe('totalsByDay', () => {
  it('groups one member by day', () => {
    const m = totalsByDay(
      [e('a', 500, '2026-08-10'), e('a', 300, '2026-08-10'), e('a', 700, '2026-08-12'), e('b', 900, '2026-08-12')],
      monthPeriod('2026-08-01'),
      'a',
    )
    expect([...m.entries()]).toEqual([
      ['2026-08-10', 800],
      ['2026-08-12', 700],
    ])
  })
})

describe('standings', () => {
  it('orders by volume descending with shares of the leader', () => {
    expect(standings(new Map([['a', 1000], ['b', 4000]]), ['a', 'b'])).toEqual([
      { profileId: 'b', ml: 4000, position: 1, share: 1 },
      { profileId: 'a', ml: 1000, position: 2, share: 0.25 },
    ])
  })

  it('lists silent members at zero', () => {
    expect(standings(new Map([['a', 1000]]), ['a', 'b'])[1]).toEqual({
      profileId: 'b',
      ml: 0,
      position: 2,
      share: 0,
    })
  })

  it('shares the position on a tie and keeps member order', () => {
    const rows = standings(new Map([['a', 1000], ['b', 1000], ['c', 500]]), ['a', 'b', 'c'])
    expect(rows.map((r) => [r.profileId, r.position])).toEqual([['a', 1], ['b', 1], ['c', 3]])
  })

  it('has zero shares and a shared first position when nobody registered', () => {
    expect(standings(new Map(), ['a', 'b']).every((r) => r.share === 0 && r.position === 1)).toBe(true)
  })
})

describe('firstRegisterDay', () => {
  it('finds the earliest live day', () => {
    expect(
      firstRegisterDay([
        e('a', 1, '2026-08-10'),
        e('b', 1, '2026-06-12'),
        e('a', 1, '2026-01-01', '2026-01-02T00:00:00Z'),
      ]),
    ).toBe('2026-06-12')
  })

  it('is undefined with no registers', () => {
    expect(firstRegisterDay([])).toBeUndefined()
  })
})

describe('dayTotals', () => {
  it('sums one member per day across all time, ignoring deleted rows and other members', () => {
    const totals = dayTotals(
      [
        e('a', 500, '2026-09-01'),
        e('a', 300, '2026-09-01'),
        e('a', 900, '2026-07-15'),
        e('a', 999, '2026-07-15', '2026-07-15T13:00:00Z'),
        e('b', 250, '2026-09-01'),
      ],
      'a',
    )
    expect([...totals.entries()]).toEqual([
      ['2026-09-01', 800],
      ['2026-07-15', 900],
    ])
  })
})
