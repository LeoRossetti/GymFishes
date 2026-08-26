import { describe, expect, it } from 'vitest'
import { validateCredentials } from './validate'

describe('validateCredentials', () => {
  it('accepts a valid pair', () => {
    expect(validateCredentials('leo@exemplo.com', 'senhaforte1')).toEqual({})
  })

  it('rejects a malformed email', () => {
    expect(validateCredentials('leo@', 'senhaforte1').email).toBeDefined()
    expect(validateCredentials('leo.exemplo.com', 'senhaforte1').email).toBeDefined()
  })

  it('rejects a short password', () => {
    expect(validateCredentials('leo@exemplo.com', 'curta').password).toBeDefined()
  })

  it('trims surrounding whitespace on the email', () => {
    expect(validateCredentials('  leo@exemplo.com  ', 'senhaforte1')).toEqual({})
  })
})
