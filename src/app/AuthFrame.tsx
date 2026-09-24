import type { ReactNode } from 'react'

/** The scroll region for routes outside the tab shell (spec M7 §4.1): same frame, no tab bar. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return <main className="scroll-region">{children}</main>
}
