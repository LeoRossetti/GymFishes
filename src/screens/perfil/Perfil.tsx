import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/AuthProvider'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { updateProfile } from '@/features/profile/mutations'
import { ACCENTS, ACCENT_BG, accentOf } from '@/lib/accents'
import { STRINGS } from '@/lib/strings'
import { supabase } from '@/lib/supabase'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'
import { BottleManager } from './BottleManager'
import { GroupCard } from './GroupCard'

export function Perfil() {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const client = useQueryClient()
  const profile = bootstrap.data?.profile
  const [nome, setNome] = useState<string | null>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!profile) return null
  const shownNome = nome ?? profile.display_name
  const trimmed = shownNome.trim()
  const nomeValido = trimmed.length >= 2 && trimmed.length <= 20
  const nomeMudou = trimmed !== profile.display_name

  async function save(patch: { display_name?: string; accent?: string }) {
    if (!userId) return
    setBusy(true)
    try {
      await updateProfile(userId, patch)
      await client.invalidateQueries({ queryKey: ['bootstrap'] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.perfil.titulo}</h1>
      </header>

      <section className="mb-3 rounded-card border border-line bg-surface p-4">
        <Field
          label={STRINGS.perfil.nome}
          value={shownNome}
          maxLength={20}
          onChange={(e) => setNome(e.target.value)}
        />
        {nomeMudou && nomeValido ? (
          <Button variant="ghost" disabled={busy} onClick={() => save({ display_name: trimmed })}>
            {STRINGS.perfil.salvar}
          </Button>
        ) : null}

        <h2 className="mt-4 mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {STRINGS.perfil.cor}
        </h2>
        <div className="flex gap-2">
          {ACCENTS.map((accent) => (
            <button
              key={accent}
              type="button"
              aria-label={STRINGS.perfil.cores[accent]}
              disabled={busy}
              onClick={() => save({ accent })}
              className={`h-11 w-11 rounded-full ${ACCENT_BG[accent]} ${
                accentOf(profile.accent) === accent ? 'border-2 border-ink' : 'border border-line'
              }`}
            />
          ))}
        </div>
      </section>

      <BottleManager userId={userId} />

      <GroupCard groupId={bootstrap.data?.groupId} />

      <Button
        variant="danger"
        className="mt-4"
        onClick={() => {
          if (!confirmandoSaida) return setConfirmandoSaida(true)
          void supabase.auth.signOut()
        }}
      >
        {confirmandoSaida ? STRINGS.perfil.sairMesmo : STRINGS.auth.sair}
      </Button>
    </div>
  )
}
