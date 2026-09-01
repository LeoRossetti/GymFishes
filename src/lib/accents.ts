export const ACCENTS = ['blue', 'green', 'yellow', 'orange', 'purple', 'pink'] as const
export type Accent = (typeof ACCENTS)[number]

export function accentOf(value: string): Accent {
  return (ACCENTS as readonly string[]).includes(value) ? (value as Accent) : 'blue'
}

/** Static class maps so Tailwind sees every class name in full. */
export const ACCENT_BG: Record<Accent, string> = {
  blue: 'bg-accent-blue',
  green: 'bg-accent-green',
  yellow: 'bg-accent-yellow',
  orange: 'bg-accent-orange',
  purple: 'bg-accent-purple',
  pink: 'bg-accent-pink',
}

export const ACCENT_TEXT: Record<Accent, string> = {
  blue: 'text-accent-blue',
  green: 'text-accent-green',
  yellow: 'text-accent-yellow',
  orange: 'text-accent-orange',
  purple: 'text-accent-purple',
  pink: 'text-accent-pink',
}
