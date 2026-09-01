import { useRef } from 'react'
import type { Member } from '@/features/group/queries'
import type { Entry } from '@/features/entries/cache'
import { dayKey } from '@/lib/dates'
import { gapText } from '@/lib/gap'
import { totalsForDay } from '@/lib/rankings'
import { MemberTube } from './MemberTube'
import { useWavePause } from './useWavePause'

type Props = { userId: string; members: Member[]; entries: Entry[] }

export function ProgressStrip({ userId, members, entries }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const paused = useWavePause(ref)
  const totals = totalsForDay(entries, dayKey(new Date()))
  const scale = Math.max(3000, ...members.map((m) => totals.get(m.id) ?? 0))
  const ordered = [...members].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
  const partner = ordered.find((m) => m.id !== userId)

  return (
    <div
      ref={ref}
      data-waves={paused ? 'paused' : undefined}
      className="rounded-card border border-line bg-surface p-4"
    >
      <div className="flex justify-center gap-3 overflow-x-auto">
        {ordered.map((m) => (
          <MemberTube
            key={m.id}
            name={m.display_name}
            isSelf={m.id === userId}
            accent={m.accent}
            totalMl={totals.get(m.id) ?? 0}
            scaleMl={scale}
          />
        ))}
      </div>
      {partner ? (
        <p className="mt-3 text-center text-[13px] font-bold text-water">
          {gapText(totals.get(userId) ?? 0, totals.get(partner.id) ?? 0, partner.display_name)}
        </p>
      ) : null}
    </div>
  )
}
