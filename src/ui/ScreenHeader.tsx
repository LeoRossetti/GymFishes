import type { ReactNode } from 'react'

/**
 * The top of every tab (spec §5): the 24px title, an optional grey line under it, and the
 * status pill at the title row's right end while there is one. Nothing else lives up here;
 * Perfil is a tab, so the header carries no shortcut to it.
 */
export function ScreenHeader({ title, subtitle, status }: { title: string; subtitle?: string; status?: ReactNode }) {
  return (
    <header className="mb-4 px-1">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">{title}</h1>
        {status}
      </div>
      {subtitle ? <p className="mt-1 text-[13px] font-medium text-ink-2">{subtitle}</p> : null}
    </header>
  )
}
