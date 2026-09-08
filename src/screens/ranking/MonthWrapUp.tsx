import { useState } from 'react'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { memberName } from '@/features/group/useGroupData'
import type { DayKey } from '@/lib/dates'
import { formatMonthTitle, formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { monthWrapUp, wrapUpStorageKey } from '@/lib/wrapup'

type Props = { entries: Entry[]; members: Member[]; userId: string; today: DayKey }

function isDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function remember(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // storage blocked (private mode): the card simply returns on the next open — harmless
  }
}

/**
 * "Julho encerrado — Ela venceu 🏆" at the top of Ranking during the following month, until
 * dismissed on this device (spec §5.3). Not synced on purpose.
 */
export function MonthWrapUp({ entries, members, userId, today }: Props) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const wrap = monthWrapUp(entries, members.map((m) => m.id), today)
  if (!wrap) return null
  const key = wrapUpStorageKey(wrap.period)
  if (dismissedKey === key || isDismissed(key)) return null

  const result = wrap.winnerId ? STRINGS.ranking.venceu(memberName(members, userId, wrap.winnerId)) : STRINGS.ranking.empate

  return (
    <section className="mb-3 flex items-start justify-between rounded-card border border-line bg-surface p-4">
      <div>
        <p className="text-[15px] font-extrabold">
          {STRINGS.ranking.encerrado(formatMonthTitle(wrap.period.start, today), result)}
        </p>
        <p className="mt-1 text-[20px] font-extrabold tracking-[-0.4px] text-water">
          {wrap.rows.map((r) => formatVolume(r.ml)).join(STRINGS.ranking.versus)}
        </p>
      </div>
      <button
        type="button"
        aria-label={STRINGS.ranking.fechar}
        onClick={() => {
          remember(key)
          setDismissedKey(key)
        }}
        className="-mr-2 -mt-2 min-h-[44px] min-w-[44px] text-[20px] text-ink-2"
      >
        ×
      </button>
    </section>
  )
}
