import type { ReactNode } from 'react'

/**
 * The top of every tab (spec §5): the 24px title, an optional 15px grey line under it, and the
 * status pill at the title row's right end while there is one. Flush with the cards' edges on
 * both sides; line heights set tight so the title, its line and the first card read as one block.
 * Nothing else lives up here; Perfil is a tab, so the header carries no shortcut to it.
 */
export function ScreenHeader({ title, subtitle, status }: { title: string; subtitle?: string; status?: ReactNode }) {
  return (
    <header className="mb-4 pt-1">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h1 className="text-[24px] leading-7 font-extrabold tracking-[-0.4px]">{title}</h1>
        {status}
      </div>
      {subtitle ? <p className="text-[15px] leading-5 font-medium text-ink-2">{subtitle}</p> : null}
    </header>
  )
}
