import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Field({ label, error, id, ...rest }: Props) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block">
        <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {label}
        </span>
      </label>
      <input
        id={inputId}
        className="min-h-[44px] w-full rounded-control border border-line bg-surface-2 px-3
                   text-[15px] text-ink outline-none focus:border-water"
        {...rest}
      />
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
    </div>
  )
}
