import { describe, expect, it } from 'vitest'
import { generateInviteCode, normalizeInviteCode } from './inviteCode'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

describe('generateInviteCode', () => {
  it('produces six characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode()
      expect(code).toHaveLength(6)
      expect(code.split('').every((c) => ALPHABET.includes(c))).toBe(true)
    }
  })

  it('never emits I, O, zero or one', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).not.toMatch(/[IO01]/)
    }
  })

  it('is deterministic given a fixed random source', () => {
    expect(generateInviteCode(() => 0)).toBe('AAAAAA')
  })

  it('matches the database constraint', () => {
    expect(generateInviteCode()).toMatch(/^[A-Z2-9]{6}$/)
  })
})

describe('normalizeInviteCode', () => {
  it('uppercases and trims', () => {
    expect(normalizeInviteCode('  abc234  ')).toBe('ABC234')
  })

  it('strips characters outside the alphabet', () => {
    expect(normalizeInviteCode('AB-C2 34')).toBe('ABC234')
    expect(normalizeInviteCode('AIBOC0D1')).toBe('ABCD')
  })

  it('caps the length at six', () => {
    expect(normalizeInviteCode('ABCDEFGH')).toBe('ABCDEF')
  })
})
