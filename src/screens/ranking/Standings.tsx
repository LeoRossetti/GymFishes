import type { Member } from '@/features/group/queries'
import { memberName } from '@/features/group/useGroupData'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import { formatVolume } from '@/lib/format'
import type { Standing } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'

type Props = { rows: Standing[]; members: Member[]; userId: string }

/**
 * `[position] [fish] [name] [bar] [total]` (spec §5.3). The bar is each member's share of
 * the leader; first place is a flat yellow badge — no crown, no glow. 🐟 is the M5 placeholder.
 */
export function Standings({ rows, members, userId }: Props) {
  if (rows.every((r) => r.ml === 0)) {
    return <p className="py-6 text-center text-[13px] text-ink-2">{STRINGS.ranking.nadaRegistrado}</p>
  }
  return (
    <ol className="mt-3">
      {rows.map((r) => {
        const member = members.find((m) => m.id === r.profileId)
        const name = memberName(members, userId, r.profileId)
        const first = r.position === 1
        return (
          <li key={r.profileId} className="flex min-h-[44px] items-center gap-3 py-1">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                first ? 'bg-streak text-ink-on-water' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {r.position}
            </span>
            <span aria-hidden className="text-[17px]">
              🐟
            </span>
            <span
              className={`w-16 shrink-0 truncate text-[13px] font-extrabold ${ACCENT_TEXT[accentOf(member?.accent ?? 'blue')]}`}
            >
              {name}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[99px] bg-surface-2">
              <span className="block h-full rounded-[99px] bg-water" style={{ width: `${Math.round(r.share * 100)}%` }} />
            </span>
            <span className="shrink-0 text-[17px] font-extrabold tracking-[-0.4px] text-water">
              {formatVolume(r.ml)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
