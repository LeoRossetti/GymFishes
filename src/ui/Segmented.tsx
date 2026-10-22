import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

/** Flat segmented control: one water-filled pill slides to the selected segment, the rest are quiet text. */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const pill = useId()
  const reduced = useReducedMotion() ?? false
  return (
    <div role="group" aria-label={label} className="flex rounded-control border border-line bg-surface-2 p-0.5">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={`relative min-h-[44px] flex-1 rounded-key text-[15px] font-extrabold ${
              selected ? 'text-ink-on-water' : 'text-ink-2 active:bg-line transition-colors duration-100'
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={reduced ? undefined : pill}
                transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
                className="absolute inset-0 rounded-key bg-water"
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
