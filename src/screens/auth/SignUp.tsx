import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { validateCredentials, type CredentialErrors } from '@/features/auth/validate'

export function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<CredentialErrors>({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFailure('')
    const found = validateCredentials(email, password)
    setErrors(found)
    if (found.email || found.password) return

    setBusy(true)
    const { error } = await supabase.auth.signUp({ email: email.trim(), password })
    setBusy(false)
    if (error) setFailure(STRINGS.erro.generico)
  }

  return (
    <form onSubmit={onSubmit} className="px-4 pt-16">
      <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">{STRINGS.app.nome}</h1>
      <Field
        label={STRINGS.auth.email}
        type="email"
        autoComplete="email"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label={STRINGS.auth.senha}
        type="password"
        autoComplete="new-password"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {failure ? <p className="mb-4 text-[13px] text-danger">{failure}</p> : null}
      <Button type="submit" disabled={busy}>
        {STRINGS.auth.criarConta}
      </Button>
      <Link to="/entrar" className="mt-6 block text-center text-[13px] font-bold text-ink-2">
        {STRINGS.auth.jaTenhoConta}
      </Link>
    </form>
  )
}
