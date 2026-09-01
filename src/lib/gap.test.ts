import { describe, expect, it } from 'vitest'
import { gapText } from './gap'

describe('gapText', () => {
  it('says you are ahead', () => {
    expect(gapText(1500, 1000, 'Ana')).toBe('Você está 500 ml na frente')
  })
  it('says the partner is ahead, with formatted litres', () => {
    expect(gapText(500, 2500, 'Ana')).toBe('Ana está 2 L na frente')
  })
  it('calls a tie, including 0 × 0', () => {
    expect(gapText(0, 0, 'Ana')).toBe('Empate técnico')
  })
})
