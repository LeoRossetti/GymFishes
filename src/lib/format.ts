import { addDays, APP_TZ, dateAtNoon, parseDayKey, type DayKey } from './dates'
import type { Period } from './periods'
import { STRINGS } from './strings'

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

const MONTH_LONG = new Intl.DateTimeFormat('pt-BR', { timeZone: APP_TZ, month: 'long' })
const MONTH_SHORT = new Intl.DateTimeFormat('pt-BR', { timeZone: APP_TZ, month: 'short' })

function monthLong(k: DayKey): string {
  return MONTH_LONG.format(dateAtNoon(k))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "7 ago" — pt-BR short months come with a trailing dot ("ago."), which we drop. */
export function formatDayShort(k: DayKey): string {
  return `${parseDayKey(k).d} ${MONTH_SHORT.format(dateAtNoon(k)).replace('.', '')}`
}

/** "segunda, 10 de agosto" */
export function formatDayLong(k: DayKey): string {
  return formatDateLong(dateAtNoon(k))
}

/** "Agosto", or "Agosto de 2025" outside the current year. */
export function formatMonthTitle(k: DayKey, today: DayKey): string {
  const name = capitalize(monthLong(k))
  const { y } = parseDayKey(k)
  return y === parseDayKey(today).y ? name : `${name} de ${y}`
}

/** "12 de junho", or "12 de junho de 2025" outside the current year. */
function dayOfMonth(k: DayKey, today: DayKey): string {
  const { d, y } = parseDayKey(k)
  const base = `${d} de ${monthLong(k)}`
  return y === parseDayKey(today).y ? base : `${base} de ${y}`
}

/** The label between the ‹ › arrows on Ranking (spec §5.3). */
export function formatPeriodLabel(p: Period, today: DayKey): string {
  switch (p.kind) {
    case 'day':
      if (p.start === today) return STRINGS.ranking.hoje
      if (p.start === addDays(today, -1)) return STRINGS.ranking.ontem
      return formatDayLong(p.start)
    case 'week': {
      const a = parseDayKey(p.start)
      const b = parseDayKey(p.end)
      const range =
        a.m === b.m
          ? `${a.d}–${b.d} de ${monthLong(p.start)}`
          : `${a.d} de ${monthLong(p.start)}–${b.d} de ${monthLong(p.end)}`
      return STRINGS.ranking.semanaDe(range)
    }
    case 'month':
      return formatMonthTitle(p.start, today)
    case 'all':
      return STRINGS.ranking.desde(dayOfMonth(p.start, today))
  }
}
