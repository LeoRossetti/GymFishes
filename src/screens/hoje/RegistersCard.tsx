import type { Entry } from '@/features/entries/cache'
import { useUpdateEntry } from '@/features/entries/mutations'
import { removeEntryPhotos } from '@/features/entries/photos'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import { useToast } from '@/ui/Toast'
import { EntryRow } from './EntryRow'

type Props = {
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
}

export function RegistersCard({ userId, groupId, members, entries, openRegister }: Props) {
  const toast = useToast()
  const update = useUpdateEntry(groupId, () => toast(STRINGS.registrar.falhou))
  const today = dayKey(new Date())
  const todays = entries.filter((e) => e.drank_on === today)
  const nameOf = (id: string) =>
    id === userId
      ? STRINGS.hoje.voce
      : (members.find((m) => m.id === id)?.display_name ?? STRINGS.hoje.alguem)

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.hoje.registrosDeHoje} · {todays.length}
      </h2>
      {todays.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-ink-2">{STRINGS.hoje.vazio}</p>
      ) : (
        <ul>
          {todays.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              authorName={nameOf(entry.profile_id)}
              isOwn={entry.profile_id === userId}
              onEdit={() => openRegister(entry)}
              onDelete={() =>
                update.mutate(
                  { id: entry.id, patch: { deleted_at: new Date().toISOString() } },
                  { onSuccess: () => removeEntryPhotos(entry.photo_path, entry.thumb_path) },
                )
              }
            />
          ))}
        </ul>
      )}
    </section>
  )
}
