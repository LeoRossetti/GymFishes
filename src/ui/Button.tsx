import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'armed'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

const BASE =
  'w-full min-h-[44px] rounded-control px-4 py-3 text-[15px] font-extrabold ' +
  'uppercase tracking-wide'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-water text-ink-on-water border-b-4 border-water-edge transition-transform ' +
    'active:translate-y-[3px] active:border-b-0 ' +
    'disabled:bg-surface-2 disabled:text-ink-2 disabled:border-line disabled:border-b disabled:translate-y-0',
  ghost:
    'bg-surface-2 text-ink-2 border border-line transition-colors duration-100 ' +
    'active:bg-line disabled:text-ink-3',
  danger:
    'bg-surface-2 text-danger border border-line transition-colors duration-100 ' +
    'active:bg-line disabled:text-ink-3',
  armed:
    'bg-danger text-ink-on-water border border-danger active:bg-danger/85 transition-colors duration-100 ' +
    'disabled:bg-surface-2 disabled:text-ink-2 disabled:border-line',
}

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest} />
}
