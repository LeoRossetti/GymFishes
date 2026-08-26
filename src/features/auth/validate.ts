import { STRINGS } from '@/lib/strings'

export type CredentialErrors = {
  email?: string
  password?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCredentials(email: string, password: string): CredentialErrors {
  const errors: CredentialErrors = {}
  if (!EMAIL.test(email.trim())) errors.email = STRINGS.auth.emailInvalido
  if (password.length < 8) errors.password = STRINGS.auth.senhaCurta
  return errors
}
