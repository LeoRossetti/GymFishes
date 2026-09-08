import type { Member } from '@/features/group/queries'
import { memberName, selfFirst } from '@/features/group/useGroupData'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import type { MemberStats } from '@/lib/averages'
import { formatDayShort, formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

type Props = { members: Member[]; userId: string; stats: ReadonlyMap<string, MemberStats> }

const EMPTY: MemberStats = {
  totalMl: 0,
  averageMl: 0,
  bestDay: null,
  daysRegistered: 0,
  daysElapsed: 0,
  registers: 0,
}

const ROWS: readonly [string, (s: MemberStats) => string][] = [
  [STRINGS.ranking.mediaPorDia, (s) => formatVolume(s.averageMl)],
  [
    STRINGS.ranking.melhorDia,
    (s) => (s.bestDay ? `${formatVolume(s.bestDay.ml)} (${formatDayShort(s.bestDay.day)})` : STRINGS.ranking.semDados),
  ],
  [STRINGS.ranking.diasRegistrados, (s) => STRINGS.ranking.de(s.daysRegistered, s.daysElapsed)],
  [STRINGS.ranking.registros, (s) => String(s.registers)],
]

/** One column per member (spec §5.3, §18) — a third member is a column, not a rewrite. */
export function StatsCompare({ members, userId, stats }: Props) {
  const ordered = selfFirst(members, userId)
  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.ranking.mediasERecordes}
      </h2>
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            <td />
            {ordered.map((m) => (
              <th
                key={m.id}
                scope="col"
                className={`pb-2 text-right text-[9px] font-extrabold uppercase tracking-[1px] ${ACCENT_TEXT[accentOf(m.accent)]}`}
              >
                {memberName(members, userId, m.id)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, render]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="py-2 text-left font-bold text-ink-2">
                {label}
              </th>
              {ordered.map((m) => (
                <td key={m.id} className="py-2 text-right font-extrabold">
                  {render(stats.get(m.id) ?? EMPTY)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
