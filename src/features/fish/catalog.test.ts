import { describe, expect, it } from 'vitest'
import { ALL_FISH_AVAILABLE, FISH_IDS, STARTERS, STREAK_MILESTONES, UNLOCKS, fishName, fishOf, habitatOf, unlockLabel } from './catalog'

describe('catalog', () => {
  it('has eighteen fish, four of them starters, and the gate is on', () => {
    expect(FISH_IDS).toHaveLength(18)
    expect(STARTERS).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
    expect(ALL_FISH_AVAILABLE).toBe(false)
  })

  it('orders the fourteen achievements from the quickest to the slowest, the whale last', () => {
    expect(FISH_IDS.slice(4)).toEqual([
      'clownfish',
      'pufferfish',
      'tucunare',
      'tambaqui',
      'dourado',
      'barracuda',
      'mahimahi',
      'grouper',
      'pintado',
      'pirarucu',
      'tuna',
      'swordfish',
      'shark',
      'whale',
    ])
  })

  it('sets the four-month ladder', () => {
    expect(UNLOCKS).toEqual({
      guppy: { kind: 'starter' },
      betta: { kind: 'starter' },
      goldfish: { kind: 'starter' },
      neon: { kind: 'starter' },
      clownfish: { kind: 'streak', days: 3 },
      pufferfish: { kind: 'mornings', before: 9, days: 5 },
      tucunare: { kind: 'streak', days: 7 },
      tambaqui: { kind: 'goalDays', ml: 2000, days: 10 },
      dourado: { kind: 'count', registers: 100 },
      barracuda: { kind: 'streak', days: 14 },
      mahimahi: { kind: 'record', ml: 3500 },
      grouper: { kind: 'volume', ml: 100_000 },
      pintado: { kind: 'days', days: 60 },
      pirarucu: { kind: 'streak', days: 30 },
      tuna: { kind: 'goalDays', ml: 2000, days: 45 },
      swordfish: { kind: 'count', registers: 400 },
      shark: { kind: 'volume', ml: 200_000 },
      whale: { kind: 'days', days: 120 },
    })
  })

  it('reads the streak milestones off the catalog', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 14, 30])
  })

  it('gives every fish a habitat: nine in the river, nine in the sea', () => {
    const fresh = ['guppy', 'betta', 'goldfish', 'neon', 'tucunare', 'tambaqui', 'dourado', 'pintado', 'pirarucu']
    for (const id of FISH_IDS) expect(habitatOf(id), id).toBe(fresh.includes(id) ? 'fresh' : 'salt')
  })

  it('shows a dropped fish as its replacement, and any other unknown variant as the guppy', () => {
    expect(fishOf('betta')).toBe('betta')
    expect(fishOf('seahorse')).toBe('barracuda')
    expect(fishOf('octopus')).toBe('swordfish')
    expect(fishOf('turtle')).toBe('mahimahi')
    expect(fishOf('dolphin')).toBe('grouper')
    expect(fishOf('')).toBe('guppy')
    expect(fishOf('dragon')).toBe('guppy')
    expect(fishOf('angelfish')).toBe('guppy')
  })

  it('names fish in pt-BR', () => {
    expect(fishName('goldfish')).toBe('Kinguio')
    expect(fishName('clownfish')).toBe('Peixe-palhaço')
    expect(fishName('pufferfish')).toBe('Baiacu')
    expect(fishName('tucunare')).toBe('Tucunaré')
    expect(fishName('tambaqui')).toBe('Tambaqui')
    expect(fishName('dourado')).toBe('Dourado')
    expect(fishName('barracuda')).toBe('Barracuda')
    expect(fishName('mahimahi')).toBe('Mahi-mahi')
    expect(fishName('grouper')).toBe('Garoupa')
    expect(fishName('pintado')).toBe('Pintado')
    expect(fishName('pirarucu')).toBe('Pirarucu')
    expect(fishName('tuna')).toBe('Atum')
    expect(fishName('swordfish')).toBe('Espadarte')
    expect(fishName('shark')).toBe('Tubarão')
    expect(fishName('whale')).toBe('Baleia')
  })

  it('names every achievement in pt-BR', () => {
    expect(unlockLabel(UNLOCKS.guppy)).toBe('Inicial')
    expect(unlockLabel(UNLOCKS.clownfish)).toBe('Sequência de 3 dias')
    expect(unlockLabel(UNLOCKS.pufferfish)).toBe('Antes das 9h em 5 dias')
    expect(unlockLabel(UNLOCKS.tucunare)).toBe('Sequência de 7 dias')
    expect(unlockLabel(UNLOCKS.tambaqui)).toBe('10 dias com 2 L')
    expect(unlockLabel(UNLOCKS.dourado)).toBe('100 registros')
    expect(unlockLabel(UNLOCKS.barracuda)).toBe('Sequência de 14 dias')
    expect(unlockLabel(UNLOCKS.mahimahi)).toBe('Um dia com 3,5 L')
    expect(unlockLabel(UNLOCKS.grouper)).toBe('100 L acumulados')
    expect(unlockLabel(UNLOCKS.pintado)).toBe('60 dias com registro')
    expect(unlockLabel(UNLOCKS.pirarucu)).toBe('Sequência de 30 dias')
    expect(unlockLabel(UNLOCKS.tuna)).toBe('45 dias com 2 L')
    expect(unlockLabel(UNLOCKS.swordfish)).toBe('400 registros')
    expect(unlockLabel(UNLOCKS.shark)).toBe('200 L acumulados')
    expect(unlockLabel(UNLOCKS.whale)).toBe('120 dias com registro')
  })
})
