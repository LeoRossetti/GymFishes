import { describe, expect, it } from 'vitest'
import { ALL_FISH_AVAILABLE, FISH_IDS, STARTERS, STREAK_MILESTONES, UNLOCKS, fishName, fishOf, habitatOf, unlockLabel } from './catalog'

describe('catalog', () => {
  it('has thirteen fish, four of them starters, and the gate is on', () => {
    expect(FISH_IDS).toHaveLength(13)
    expect(STARTERS).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
    expect(ALL_FISH_AVAILABLE).toBe(false)
  })

  it('orders the nine achievements from quickest to slowest, with the tambaqui in the middle', () => {
    expect(FISH_IDS.slice(4)).toEqual([
      'pufferfish',
      'clownfish',
      'octopus',
      'seahorse',
      'tambaqui',
      'turtle',
      'dolphin',
      'shark',
      'whale',
    ])
    expect(UNLOCKS.tambaqui).toEqual({ kind: 'streak', days: 7 })
  })

  it('reads the streak milestones off the catalog', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 14])
  })

  it('gives every fish a habitat: five in fresh water, eight in salt', () => {
    const fresh = ['guppy', 'betta', 'goldfish', 'neon', 'tambaqui']
    for (const id of FISH_IDS) expect(habitatOf(id)).toBe(fresh.includes(id) ? 'fresh' : 'salt')
  })

  it('falls back to guppy for an unknown variant', () => {
    expect(fishOf('betta')).toBe('betta')
    expect(fishOf('')).toBe('guppy')
    expect(fishOf('dragon')).toBe('guppy')
    expect(fishOf('angelfish')).toBe('guppy')
  })

  it('names fish in pt-BR', () => {
    expect(fishName('goldfish')).toBe('Peixe-dourado')
    expect(fishName('clownfish')).toBe('Peixe-palhaço')
    expect(fishName('tambaqui')).toBe('Tambaqui')
  })

  it('names every achievement in pt-BR', () => {
    expect(unlockLabel(UNLOCKS.guppy)).toBe('Inicial')
    expect(unlockLabel(UNLOCKS.pufferfish)).toBe('Registre com uma garrafa')
    expect(unlockLabel(UNLOCKS.clownfish)).toBe('Registre com uma nota')
    expect(unlockLabel(UNLOCKS.octopus)).toBe('Registre antes das 9h')
    expect(unlockLabel(UNLOCKS.seahorse)).toBe('Sequência de 3 dias')
    expect(unlockLabel(UNLOCKS.tambaqui)).toBe('Sequência de 7 dias')
    expect(unlockLabel(UNLOCKS.turtle)).toBe('Um dia acima de 3 L')
    expect(unlockLabel(UNLOCKS.dolphin)).toBe('Sequência de 14 dias')
    expect(unlockLabel(UNLOCKS.shark)).toBe('50 registros')
    expect(unlockLabel(UNLOCKS.whale)).toBe('60 L acumulados')
  })

  it('names the counted achievements in pt-BR', () => {
    expect(unlockLabel({ kind: 'mornings', before: 9, days: 5 })).toBe('Antes das 9h em 5 dias')
    expect(unlockLabel({ kind: 'goalDays', ml: 2000, days: 10 })).toBe('10 dias com 2 L')
    expect(unlockLabel({ kind: 'days', days: 60 })).toBe('60 dias com registro')
  })
})
