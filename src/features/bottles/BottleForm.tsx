import { useState } from 'react'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { Field } from '@/ui/Field'

type Input = { name: string; volume_ml: number; emoji: string | null }
type Props = { initial?: Input; busy?: boolean; onSave: (input: Input) => void }

export function BottleForm({ initial, busy, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [volume, setVolume] = useState(initial ? String(initial.volume_ml) : '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '')
  const [errors, setErrors] = useState<{ name?: string; volume?: string }>({})

  function submit() {
    const trimmed = name.trim()
    const volumeMl = Number(volume)
    const found: typeof errors = {}
    if (trimmed.length < 1 || trimmed.length > 30) found.name = STRINGS.garrafas.nomeInvalido
    if (!Number.isInteger(volumeMl) || volumeMl < 1 || volumeMl > 10000)
      found.volume = STRINGS.garrafas.volumeInvalido
    setErrors(found)
    if (found.name || found.volume) return
    onSave({ name: trimmed, volume_ml: volumeMl, emoji: emoji.trim() || null })
  }

  return (
    <div>
      <Field
        label={STRINGS.garrafas.nome}
        value={name}
        maxLength={30}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label={STRINGS.garrafas.volume}
        value={volume}
        inputMode="numeric"
        error={errors.volume}
        onChange={(e) => setVolume(e.target.value.replace(/\D/g, ''))}
      />
      <Field
        label={STRINGS.garrafas.emoji}
        value={emoji}
        maxLength={4}
        onChange={(e) => setEmoji(e.target.value)}
      />
      <Button variant="ghost" disabled={busy} onClick={submit}>
        {STRINGS.garrafas.salvar}
      </Button>
    </div>
  )
}
