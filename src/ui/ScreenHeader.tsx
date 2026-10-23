import type { ReactNode } from 'react'

/**
 * The top of every tab (spec §5): the 28px / 800 title centred on the screen, an optional 15px
 * grey line under it, and the status pill centred on its own line below while there is one, so
 * it never pushes the title off centre or runs into it. The tab bar shows only icons; this title
 * is where the screen's name is read. Nothing else lives up here; Perfil is a tab, so the header
 * carries no shortcut to it.
 */
export function ScreenHeader({ title, subtitle, status }: { title: string; subtitle?: string; status?: ReactNode }) {
  return (
    <header className="mb-4 pt-1 text-center">
      <h1 className="text-[28px] leading-8 font-extrabold tracking-[-0.5px]">{title}</h1>
      {subtitle ? <p className="text-[15px] leading-5 font-medium text-ink-2">{subtitle}</p> : null}
      {/* The pill renders nothing while online; `empty:hidden` then drops its line and margin. */}
      <div className="mt-2 flex justify-center empty:hidden">{status}</div>
    </header>
  )
}
