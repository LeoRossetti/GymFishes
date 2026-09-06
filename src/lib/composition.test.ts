import { describe, expect, it } from 'vitest'
import {
  buildComposition,
  compositionChips,
  describeComposition,
  parseComposition,
  totalMl,
} from './composition'

const garrafa = { name: 'Garrafa azul', volume_ml: 1500, qty: 1 }

describe('buildComposition', () => {
  it('combines bottles and a loose amount', () => {
    expect(buildComposition([garrafa], 300)).toEqual([
      { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 1 },
      { kind: 'loose', amount_ml: 300 },
    ])
  })
  it('drops zero-qty bottles and a zero loose amount', () => {
    expect(buildComposition([{ ...garrafa, qty: 0 }], 0)).toEqual([])
  })
})

describe('totalMl', () => {
  it('multiplies bottle volume by qty and adds loose', () => {
    const items = buildComposition([{ ...garrafa, qty: 2 }], 300)
    expect(totalMl(items)).toBe(3300)
  })
  it('is 0 for an empty composition', () => {
    expect(totalMl([])).toBe(0)
  })
})

describe('describeComposition', () => {
  it('renders "1 × Garrafa azul + 300 ml"', () => {
    expect(describeComposition(buildComposition([garrafa], 300))).toBe(
      '1 × Garrafa azul + 300 ml',
    )
  })
})

describe('compositionChips', () => {
  it('renders bottle chips with volume and a "+" loose chip', () => {
    expect(compositionChips(buildComposition([garrafa], 300))).toEqual([
      '1 × Garrafa azul 1,5 L',
      '+ 300 ml',
    ])
  })
})

describe('parseComposition', () => {
  it('round-trips its own output', () => {
    const items = buildComposition([garrafa], 300)
    expect(parseComposition(JSON.parse(JSON.stringify(items)))).toEqual(items)
  })
  it('drops malformed items and non-arrays', () => {
    expect(parseComposition('garbage')).toEqual([])
    expect(parseComposition([{ kind: 'bottle', name: 'x' }, null, 5])).toEqual([])
  })
})
