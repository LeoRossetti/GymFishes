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
      'sailfish',
      'shark',
      'whale',
    ])
  })

  it('sets the four-month ladder, eased for someone who misses a day a week', () => {
    expect(UNLOCKS).toEqual({
      guppy: { kind: 'starter' },
      betta: { kind: 'starter' },
      goldfish: { kind: 'starter' },
      neon: { kind: 'starter' },
      clownfish: { kind: 'streak', days: 3 },
      pufferfish: { kind: 'mornings', before: 10, days: 5 },
      tucunare: { kind: 'streak', days: 5 },
      tambaqui: { kind: 'goalDays', ml: 2000, days: 5 },
      dourado: { kind: 'count', registers: 75 },
      barracuda: { kind: 'streak', days: 10 },
      mahimahi: { kind: 'record', ml: 2500 },
      grouper: { kind: 'volume', ml: 60_000 },
      pintado: { kind: 'days', days: 50 },
      pirarucu: { kind: 'streak', days: 14 },
      tuna: { kind: 'goalDays', ml: 2000, days: 15 },
      sailfish: { kind: 'count', registers: 250 },
      shark: { kind: 'volume', ml: 150_000 },
      whale: { kind: 'days', days: 100 },
    })
  })

  it('reads the streak milestones off the catalog', () => {
    expect(STREAK_MILESTONES).toEqual([3, 5, 10, 14])
  })

  it('gives every fish a habitat: nine in the river, nine in the sea', () => {
    const fresh = ['guppy', 'betta', 'goldfish', 'neon', 'tucunare', 'tambaqui', 'dourado', 'pintado', 'pirarucu']
    for (const id of FISH_IDS) expect(habitatOf(id), id).toBe(fresh.includes(id) ? 'fresh' : 'salt')
  })

  it('shows a dropped fish as its replacement, and any other unknown variant as the guppy', () => {
    expect(fishOf('betta')).toBe('betta')
    expect(fishOf('seahorse')).toBe('barracuda')
    expect(fishOf('octopus')).toBe('sailfish')
    expect(fishOf('swordfish')).toBe('sailfish')
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
    expect(fishName('sailfish')).toBe('Agulhão-bandeira')
    expect(fishName('shark')).toBe('Tubarão')
    expect(fishName('whale')).toBe('Baleia')
  })

  it('names every achievement in pt-BR', () => {
    expect(unlockLabel(UNLOCKS.guppy)).toBe('Inicial')
    expect(unlockLabel(UNLOCKS.clownfish)).toBe('Sequência de 3 dias')
    expect(unlockLabel(UNLOCKS.pufferfish)).toBe('Antes das 10h em 5 dias')
    expect(unlockLabel(UNLOCKS.tucunare)).toBe('Sequência de 5 dias')
    expect(unlockLabel(UNLOCKS.tambaqui)).toBe('5 dias com 2 L')
    expect(unlockLabel(UNLOCKS.dourado)).toBe('75 registros')
    expect(unlockLabel(UNLOCKS.barracuda)).toBe('Sequência de 10 dias')
    expect(unlockLabel(UNLOCKS.mahimahi)).toBe('Um dia com 2,5 L')
    expect(unlockLabel(UNLOCKS.grouper)).toBe('60 L acumulados')
    expect(unlockLabel(UNLOCKS.pintado)).toBe('50 dias com registro')
    expect(unlockLabel(UNLOCKS.pirarucu)).toBe('Sequência de 14 dias')
    expect(unlockLabel(UNLOCKS.tuna)).toBe('15 dias com 2 L')
    expect(unlockLabel(UNLOCKS.sailfish)).toBe('250 registros')
    expect(unlockLabel(UNLOCKS.shark)).toBe('150 L acumulados')
    expect(unlockLabel(UNLOCKS.whale)).toBe('100 dias com registro')
  })
})
