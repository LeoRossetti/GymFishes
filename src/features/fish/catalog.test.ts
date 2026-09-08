import { describe, expect, it } from 'vitest'
import { FISH_IDS, STARTERS, STREAK_MILESTONES, UNLOCKS, fishName, fishOf, unlockLabel } from './catalog'

describe('catalog', () => {
  it('has thirteen fish, four of them starters', () => {
    expect(FISH_IDS).toHaveLength(13)
    expect(STARTERS).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
  })

  it('reads the streak milestones off the catalog', () => {
    expect(STREAK_MILESTONES).toEqual([7, 30, 100])
  })

  it('falls back to guppy for an unknown variant', () => {
    expect(fishOf('betta')).toBe('betta')
    expect(fishOf('')).toBe('guppy')
    expect(fishOf('dragon')).toBe('guppy')
  })

  it('names fish in pt-BR', () => {
    expect(fishName('goldfish')).toBe('Peixe-dourado')
    expect(fishName('clownfish')).toBe('Peixe-palhaço')
  })

  it('describes every unlock condition in pt-BR', () => {
    expect(unlockLabel(UNLOCKS.guppy)).toBe('Inicial')
    expect(unlockLabel(UNLOCKS.pufferfish)).toBe('Sequência de 7 dias')
    expect(unlockLabel(UNLOCKS.octopus)).toBe('Um dia acima de 5 L')
    expect(unlockLabel(UNLOCKS.seahorse)).toBe('100 L acumulados')
    expect(unlockLabel(UNLOCKS.dolphin)).toBe('1000 L acumulados')
    expect(unlockLabel(UNLOCKS.shark)).toBe('Ganhar 1 mês')
    expect(unlockLabel(UNLOCKS.whale)).toBe('Ganhar 3 meses')
  })
})
