export const APP_TZ = 'America/Sao_Paulo'

/** Always `YYYY-MM-DD`, interpreted in APP_TZ. */
export type DayKey = string

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const DAY_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function dayKey(d: Date): DayKey {
  const parts = DAY_PARTS.formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function parseDayKey(k: DayKey): { y: number; m: number; d: number } {
  const [y, m, d] = k.split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`DayKey inválido: ${k}`)
  }
  return { y, m, d }
}

export function addDays(k: DayKey, n: number): DayKey {
  const { y, m, d } = parseDayKey(k)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayMon0(k: DayKey): number {
  const { y, m, d } = parseDayKey(k)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

/** São Paulo has a fixed -03:00 offset — DST was abolished in 2019. */
const SP_OFFSET = '-03:00'

const LOCAL_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Date → "YYYY-MM-DDTHH:mm" in APP_TZ, for `<input type="datetime-local">`. */
export function toDatetimeLocal(d: Date): string {
  const parts = LOCAL_PARTS.formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** "YYYY-MM-DDTHH:mm" interpreted as APP_TZ wall time → Date. */
export function fromDatetimeLocal(s: string): Date {
  return new Date(`${s}:00${SP_OFFSET}`)
}
