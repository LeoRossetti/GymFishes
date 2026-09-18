import { STRINGS } from '@/lib/strings'

export type CredentialErrors = {
  email?: string
  password?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(email: string, passwordError: string | undefined): CredentialErrors {
  const errors: CredentialErrors = {}
  if (!EMAIL.test(email.trim())) errors.email = STRINGS.auth.emailInvalido
  if (passwordError) errors.password = passwordError
  return errors
}

/** Sign-up: a new password must meet the 8-character minimum. */
export function validateCredentials(email: string, password: string): CredentialErrors {
  return validate(email, password.length < 8 ? STRINGS.auth.senhaCurta : undefined)
}

/** Login: an existing password just needs to be present — the length rule belongs to sign-up. */
export function validateLoginCredentials(email: string, password: string): CredentialErrors {
  return validate(email, password.length === 0 ? STRINGS.auth.senhaObrigatoria : undefined)
}
