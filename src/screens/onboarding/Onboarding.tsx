import { useState } from 'react'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { useSession } from '@/features/auth/AuthProvider'
import { createProfile } from '@/features/profile/mutations'
import { createGroup, joinGroup } from '@/features/group/mutations'

type Stage = 'nome' | 'grupo' | 'criar' | 'entrar'

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { session } = useSession()
  const userId = session?.user.id
  const [stage, setStage] = useState<Stage>('nome')
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitNome() {
    setError('')
    const trimmed = nome.trim()
    if (trimmed.length < 2) return setError(STRINGS.onboarding.nomeCurto)
    if (trimmed.length > 20) return setError(STRINGS.onboarding.nomeLongo)
    if (!userId) return setError(STRINGS.erro.generico)

    setBusy(true)
    try {
      await createProfile(userId, trimmed)
      setStage('grupo')
    } catch {
      setError(STRINGS.erro.generico)
    } finally {
      setBusy(false)
    }
  }

  async function submitCriar() {
    setError('')
    if (grupo.trim().length < 1 || !userId) return setError(STRINGS.erro.generico)
    setBusy(true)
    try {
      await createGroup(grupo, userId)
      onDone()
    } catch {
      setError(STRINGS.erro.generico)
    } finally {
      setBusy(false)
    }
  }

  async function submitEntrar() {
    setError('')
    setBusy(true)
    try {
      await joinGroup(codigo)
      onDone()
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('invalid_code')
          ? STRINGS.onboarding.codigoInvalido
          : STRINGS.erro.generico,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-16">
      {stage === 'nome' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.tituloNome}
          </h1>
          <Field
            label={STRINGS.onboarding.campoNome}
            value={nome}
            maxLength={20}
            error={error}
            onChange={(e) => setNome(e.target.value)}
          />
          <Button onClick={submitNome} disabled={busy}>
            {STRINGS.onboarding.continuar}
          </Button>
        </>
      ) : null}

      {stage === 'grupo' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.tituloGrupo}
          </h1>
          <Button className="mb-3" onClick={() => setStage('criar')}>
            {STRINGS.onboarding.criarGrupo}
          </Button>
          <Button variant="ghost" onClick={() => setStage('entrar')}>
            {STRINGS.onboarding.entrarComCodigo}
          </Button>
        </>
      ) : null}

      {stage === 'criar' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.criarGrupo}
          </h1>
          <Field
            label={STRINGS.onboarding.campoGrupo}
            value={grupo}
            maxLength={40}
            error={error}
            onChange={(e) => setGrupo(e.target.value)}
          />
          <Button onClick={submitCriar} disabled={busy}>
            {STRINGS.onboarding.continuar}
          </Button>
        </>
      ) : null}

      {stage === 'entrar' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.entrarComCodigo}
          </h1>
          <Field
            label={STRINGS.onboarding.campoCodigo}
            value={codigo}
            maxLength={6}
            autoCapitalize="characters"
            error={error}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <Button onClick={submitEntrar} disabled={busy}>
            {STRINGS.onboarding.continuar}
          </Button>
        </>
      ) : null}
    </div>
  )
}
