import { describe, expect, it } from 'vitest'
import { validateCredentials, validateLoginCredentials } from './validate'

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

describe('validateLoginCredentials', () => {
  it('accepts any non-empty password, however short', () => {
    expect(validateLoginCredentials('leo@exemplo.com', 'curta')).toEqual({})
  })

  it('rejects an empty password', () => {
    expect(validateLoginCredentials('leo@exemplo.com', '').password).toBeDefined()
  })

  it('rejects a malformed email', () => {
    expect(validateLoginCredentials('leo@', 'x').email).toBeDefined()
  })
})
