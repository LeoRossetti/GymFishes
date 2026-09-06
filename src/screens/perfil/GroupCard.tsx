import { Fragment, useState } from 'react'
import { useGroup, useMembers } from '@/features/group/queries'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

export function GroupCard({ groupId }: { groupId: string | null | undefined }) {
  const group = useGroup(groupId)
  const members = useMembers(groupId)
  const [copiado, setCopiado] = useState(false)

  if (!group.data) return null
  const code = group.data.invite_code

  return (
    <section className="mb-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.perfil.grupo}
      </h2>
      <p className="text-[17px] font-bold">{group.data.name}</p>
      <p className="mt-1 text-[13px] text-ink-2">
        {STRINGS.perfil.membros}:{' '}
        {(members.data ?? []).map((m, i) => (
          <Fragment key={m.id}>
            {i > 0 ? ', ' : ''}
            <span>{m.display_name}</span>
          </Fragment>
        ))}
      </p>
      <p className="mt-4 text-center text-[24px] font-extrabold tracking-[6px]">{code}</p>
      {typeof navigator !== 'undefined' && navigator.clipboard ? (
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => setCopiado(true)).catch(() => {})
          }}
        >
          {copiado ? STRINGS.grupo.copiado : STRINGS.grupo.copiarCodigo}
        </Button>
      ) : null}
    </section>
  )
}
