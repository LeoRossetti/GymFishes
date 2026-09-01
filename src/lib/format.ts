import { APP_TZ } from './dates'

export function formatVolume(ml: number): string {
  if (ml < 1000) return `${ml} ml`
  const liters = Math.round(ml / 100) / 10
  const fixed = liters.toFixed(1)
  const trimmed = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  return `${trimmed.replace('.', ',')} L`
}

const LONG_DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatDateLong(d: Date): string {
  const parts = LONG_DATE.formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekday = get('weekday').replace('-feira', '')
  return `${weekday}, ${get('day')} de ${get('month')}`
}

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatTime(d: Date): string {
  return TIME.format(d)
}
