import { describe, expect, it } from 'vitest'
import type { FishId } from '@/features/fish/catalog'
import { celebrationText, celebrationsFor, present, type Celebration, type DayState } from './engine'

const STARTERS: FishId[] = ['guppy', 'betta', 'goldfish', 'neon']

function state(over: Partial<DayState> = {}): DayState {
  return { todayMl: 0, bestOtherDayMl: 0, leading: false, streakDays: 0, unlocked: new Set(STARTERS), ...over }
}

describe('celebrationsFor', () => {
  it('is empty when nothing worth celebrating changed', () => {
    expect(celebrationsFor(state({ todayMl: 500 }), state({ todayMl: 800 }))).toEqual([])
  })

  it('celebrates each newly unlocked fish, in catalog order', () => {
    const after = state({ unlocked: new Set<FishId>([...STARTERS, 'shark', 'pufferfish']) })
    expect(celebrationsFor(state(), after)).toEqual([
      { kind: 'unlock', fish: 'pufferfish' },
      { kind: 'unlock', fish: 'shark' },
    ])
  })

  it('needs a previous best to beat — day one is not a record', () => {
    expect(celebrationsFor(state({ todayMl: 1000 }), state({ todayMl: 4200 }))).toEqual([])
  })

  it('fires the record once, when today first passes the old best', () => {
    const before = state({ todayMl: 3900, bestOtherDayMl: 4000 })
    expect(celebrationsFor(before, state({ todayMl: 4000, bestOtherDayMl: 4000 }))).toEqual([])
    expect(celebrationsFor(before, state({ todayMl: 4200, bestOtherDayMl: 4000 }))).toEqual([{ kind: 'record', ml: 4200 }])
    expect(
      celebrationsFor(state({ todayMl: 4200, bestOtherDayMl: 4000 }), state({ todayMl: 4500, bestOtherDayMl: 4000 })),
    ).toEqual([])
  })

  it('fires the highest streak milestone crossed', () => {
    expect(celebrationsFor(state({ streakDays: 6 }), state({ streakDays: 7 }))).toEqual([{ kind: 'streak', days: 7 }])
    expect(celebrationsFor(state({ streakDays: 7 }), state({ streakDays: 7 }))).toEqual([])
    expect(celebrationsFor(state({ streakDays: 5 }), state({ streakDays: 31 }))).toEqual([{ kind: 'streak', days: 30 }])
  })

  it('fires the lead only on the transition', () => {
    expect(celebrationsFor(state({ leading: false }), state({ leading: true }))).toEqual([{ kind: 'lead' }])
    expect(celebrationsFor(state({ leading: true }), state({ leading: true }))).toEqual([])
  })

  it('fires a round litre when the whole-litre count grows', () => {
    expect(celebrationsFor(state({ todayMl: 1800 }), state({ todayMl: 2300 }))).toEqual([{ kind: 'litre', litres: 2 }])
    expect(celebrationsFor(state({ todayMl: 2100 }), state({ todayMl: 2900 }))).toEqual([])
  })

  it('orders everything by spec priority: unlock > record > streak > lead > litre', () => {
    const before = state({ todayMl: 900, bestOtherDayMl: 1500, streakDays: 6 })
    const after = state({
      todayMl: 2000,
      bestOtherDayMl: 1500,
      streakDays: 7,
      leading: true,
      unlocked: new Set<FishId>([...STARTERS, 'pufferfish']),
    })
    expect(celebrationsFor(before, after).map((c) => c.kind)).toEqual(['unlock', 'record', 'streak', 'lead', 'litre'])
  })
})

describe('present', () => {
  it('shows at most one full screen and demotes the other big ones to toasts', () => {
    const cels: Celebration[] = [
      { kind: 'unlock', fish: 'pufferfish' },
      { kind: 'record', ml: 4200 },
      { kind: 'streak', days: 7 },
      { kind: 'lead' },
      { kind: 'litre', litres: 2 },
    ]
    const p = present(cels)
    expect(p.fullScreen).toEqual({ kind: 'unlock', fish: 'pufferfish' })
    expect(p.toasts).toEqual([{ kind: 'record', ml: 4200 }, { kind: 'streak', days: 7 }, { kind: 'lead' }])
    expect(p.inline).toBeNull()
  })

  it('shows the litre inline only when it is alone', () => {
    expect(present([{ kind: 'litre', litres: 2 }]).inline).toEqual({ kind: 'litre', litres: 2 })
    expect(present([{ kind: 'lead' }, { kind: 'litre', litres: 2 }])).toEqual({
      fullScreen: null,
      toasts: [{ kind: 'lead' }],
      inline: null,
    })
  })

  it('is all empty for no celebrations', () => {
    expect(present([])).toEqual({ fullScreen: null, toasts: [], inline: null })
  })
})

describe('celebrationText', () => {
  it('reads in pt-BR', () => {
    expect(celebrationText({ kind: 'unlock', fish: 'pufferfish' })).toBe('Novo peixe! Baiacu')
    expect(celebrationText({ kind: 'record', ml: 4200 })).toBe('Novo recorde! 4,2 L')
    expect(celebrationText({ kind: 'streak', days: 30 })).toBe('🔥 30 dias seguidos!')
    expect(celebrationText({ kind: 'lead' })).toBe('Você assumiu a liderança 🏆')
    expect(celebrationText({ kind: 'litre', litres: 2 })).toBe('2 L hoje')
  })
})
