import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'

export function Hoje() {
  const now = new Date()
  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.hoje.titulo}</h1>
        <p className="mt-1 text-[10px] text-ink-3">{formatDateLong(now)}</p>
      </header>
      <div className="rounded-card border border-line bg-surface p-5 text-center">
        <p className="text-[13px] text-ink-2">{STRINGS.hoje.vazio}</p>
      </div>
    </div>
  )
}
