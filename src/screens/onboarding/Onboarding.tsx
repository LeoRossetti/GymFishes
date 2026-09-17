import { useEffect, useRef, useState } from 'react'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { useSession } from '@/features/auth/AuthProvider'
import { createProfile, updateProfile } from '@/features/profile/mutations'
import { createGroup, joinGroup } from '@/features/group/mutations'
import { STARTERS, type FishId } from '@/features/fish/catalog'
import { FishGrid } from '@/features/fish/FishGrid'

type Stage = 'nome' | 'peixe' | 'grupo' | 'criar' | 'entrar' | 'codigo'

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { session } = useSession()
  const userId = session?.user.id
  const [stage, setStage] = useState<Stage>('nome')
  const [nome, setNome] = useState('')
  const [grupo, setGrupo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  function copyInviteCode() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard
      .writeText(inviteCode)
      .then(() => {
        setCopiado(true)
        clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopiado(false), 2000)
      })
      .catch(() => {})
  }

  async function submitNome() {
    setError('')
    const trimmed = nome.trim()
    if (trimmed.length < 2) return setError(STRINGS.onboarding.nomeCurto)
    if (trimmed.length > 20) return setError(STRINGS.onboarding.nomeLongo)
    if (!userId) return setError(STRINGS.erro.generico)

    setBusy(true)
    try {
      await createProfile(userId, trimmed)
      setStage('peixe')
    } catch {
      setError(STRINGS.erro.generico)
    } finally {
      setBusy(false)
    }
  }

  async function pickPeixe(fish: FishId) {
    setError('')
    if (!userId) return setError(STRINGS.erro.generico)
    setBusy(true)
    try {
      await updateProfile(userId, { fish_variant: fish })
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
      const group = await createGroup(grupo, userId)
      setInviteCode(group.inviteCode)
      setStage('codigo')
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
          <Button onClick={submitNome} disabled={busy} aria-busy={busy || undefined}>
            {busy ? STRINGS.onboarding.salvando : STRINGS.onboarding.continuar}
          </Button>
        </>
      ) : null}

      {stage === 'peixe' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.tituloPeixe}
          </h1>
          <FishGrid
            variants={STARTERS}
            unlocked={new Set(STARTERS)}
            selected={null}
            disabled={busy}
            onSelect={pickPeixe}
          />
          {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
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
          <Button onClick={submitCriar} disabled={busy} aria-busy={busy || undefined}>
            {busy ? STRINGS.onboarding.salvando : STRINGS.onboarding.continuar}
          </Button>
          <Button variant="ghost" className="mt-3" onClick={() => { setError(''); setStage('grupo') }}>
            {STRINGS.onboarding.voltar}
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
          <Button onClick={submitEntrar} disabled={busy} aria-busy={busy || undefined}>
            {busy ? STRINGS.onboarding.salvando : STRINGS.onboarding.continuar}
          </Button>
          <Button variant="ghost" className="mt-3" onClick={() => { setError(''); setStage('grupo') }}>
            {STRINGS.onboarding.voltar}
          </Button>
        </>
      ) : null}

      {stage === 'codigo' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.grupo.codigoDoConvite}
          </h1>
          <p className="mb-2 text-center text-[38px] font-extrabold tracking-[6px]">
            {inviteCode}
          </p>
          <p className="mb-8 text-center text-[13px] text-ink-2">
            {STRINGS.grupo.mostreEsteCodigo}
          </p>
          {typeof navigator !== 'undefined' && navigator.clipboard ? (
            <Button className="mb-3" variant="ghost" onClick={copyInviteCode}>
              {copiado ? STRINGS.grupo.copiado : STRINGS.grupo.copiarCodigo}
            </Button>
          ) : null}
          <Button onClick={onDone}>{STRINGS.onboarding.continuar}</Button>
        </>
      ) : null}
    </div>
  )
}
