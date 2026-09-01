import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

const BASE =
  'w-full min-h-[44px] rounded-control px-4 py-3 text-[15px] font-extrabold ' +
  'uppercase tracking-wide transition-transform disabled:opacity-40'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-water text-[#0A2A3A] border-b-4 border-water-edge ' +
    'active:translate-y-[3px] active:border-b-0',
  ghost: 'bg-surface-2 text-ink-2 border border-line',
  danger: 'bg-surface-2 text-danger border border-line',
}

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest} />
}
