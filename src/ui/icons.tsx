import type { ReactNode, SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Rendered width and height in px. */
  size?: number
  /** Solid main shape — the active tab, the register tile. Pure-stroke icons ignore it. */
  filled?: boolean
}

type SvgProps = Omit<IconProps, 'filled'> & { name: string; children: ReactNode }

/**
 * One flat stroke set, 24×24, drawn in `currentColor` so it follows the text colour of its
 * parent (spec M7 §6). Every icon is decorative: the control it sits in carries the name.
 */
function Svg({ size = 24, name, children, ...rest }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      {...rest}
    >
      {children}
    </svg>
  )
}

const fillOf = (filled: boolean) => (filled ? 'currentColor' : 'none')

export function Drop({ filled = false, ...rest }: IconProps) {
  return (
    <Svg name="drop" {...rest}>
      <path d="M12 3C12 3 5.5 10.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.5 12 3 12 3Z" fill={fillOf(filled)} />
    </Svg>
  )
}

export function Trophy({ filled = false, ...rest }: IconProps) {
  return (
    <Svg name="trophy" {...rest}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" fill={fillOf(filled)} />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M12 14v4" />
      <path d="M8 21h8" />
      <path d="M9 18h6v3" />
    </Svg>
  )
}

export function Calendar({ filled = false, ...rest }: IconProps) {
  // Filled (spec M7 §5): the whole card fills solid, same weight as Drop; the header line and
  // posts switch to the page background so they read as cut-outs instead of vanishing into the fill.
  const cutout = filled ? 'var(--color-bg)' : undefined
  return (
    <Svg name="calendar" {...rest}>
      <rect x="3" y="5" width="18" height="16" rx="3" fill={fillOf(filled)} />
      <path d="M3 10h18" stroke={cutout} />
      <path d="M8 3v4" stroke={cutout} />
      <path d="M16 3v4" stroke={cutout} />
    </Svg>
  )
}

export function FishIcon({ filled = false, ...rest }: IconProps) {
  return (
    <Svg name="fish" {...rest}>
      <path d="M7 12c2.5-4.5 7-6.5 11-5 1.6.6 3 1.7 4 3.5-1 1.8-2.4 2.9-4 3.5-4 1.5-8.5-.5-11-2z" fill={fillOf(filled)} />
      <path d="M7 12 2.5 8.5v7z" fill={fillOf(filled)} />
      <circle cx="17.5" cy="10.5" r="1.2" fill={filled ? 'var(--color-bg)' : 'currentColor'} stroke="none" />
    </Svg>
  )
}

export function Plus({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="plus" {...rest}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function Flame({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="flame" stroke="none" {...rest}>
      <path
        d="M12 22c4.4 0 7-2.9 7-6.6 0-2.5-1.3-4.6-3.2-6.4-.3 1.6-1.2 2.7-2.3 3.2.6-3.2-.6-6.5-3.5-8.2.3 3-1.1 4.3-2.6 5.9C5.8 11.5 5 13.4 5 15.4 5 19.1 7.6 22 12 22z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function Camera({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="camera" {...rest}>
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  )
}

export function Note({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="note" {...rest}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Svg>
  )
}

export function Clock({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="clock" {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function Check({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="check" {...rest}>
      <path d="M5 12.5l5 5L19 7" />
    </Svg>
  )
}

export function Close({ filled: _filled, ...rest }: IconProps) {
  return (
    <Svg name="close" {...rest}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  )
}
