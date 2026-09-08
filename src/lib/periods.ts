import { addDays, daysBetween, pad2, parseDayKey, weekdayMon0, type DayKey } from './dates'

export type PeriodKind = 'day' | 'week' | 'month' | 'all'

export type Period = {
  kind: PeriodKind
  start: DayKey
  end: DayKey
}

export function dayPeriod(k: DayKey): Period {
  return { kind: 'day', start: k, end: k }
}

export function weekPeriod(k: DayKey): Period {
  const start = addDays(k, -weekdayMon0(k))
  return { kind: 'week', start, end: addDays(start, 6) }
}

export function monthPeriodOf(y: number, m: number): Period {
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return {
    kind: 'month',
    start: `${y}-${pad2(m)}-01`,
    end: `${y}-${pad2(m)}-${pad2(lastDay)}`,
  }
}

export function monthPeriod(k: DayKey): Period {
  const { y, m } = parseDayKey(k)
  return monthPeriodOf(y, m)
}

export function allPeriod(firstDay: DayKey, today: DayKey): Period {
  return { kind: 'all', start: firstDay, end: today }
}

export function stepPeriod(p: Period, delta: -1 | 1): Period {
  switch (p.kind) {
    case 'day':
      return dayPeriod(addDays(p.start, delta))
    case 'week':
      return weekPeriod(addDays(p.start, delta * 7))
    case 'month': {
      const { y, m } = parseDayKey(p.start)
      const index = y * 12 + (m - 1) + delta
      return monthPeriodOf(Math.floor(index / 12), (index % 12) + 1)
    }
    case 'all':
      return p
  }
}

export function containsDay(p: Period, k: DayKey): boolean {
  return k >= p.start && k <= p.end
}

/** Every day of the period, in order. */
export function daysOf(p: Period): DayKey[] {
  const n = daysBetween(p.start, p.end) + 1
  return Array.from({ length: Math.max(0, n) }, (_, i) => addDays(p.start, i))
}

/**
 * Days from the period start through `today`, or through the period end if that came
 * first. This is the "Média por dia" divisor (spec §5.3): skipping a day still counts.
 */
export function daysElapsed(p: Period, today: DayKey): number {
  if (p.start > today) return 0
  const last = p.end < today ? p.end : today
  return daysBetween(p.start, last) + 1
}

/** The period of `kind` that contains today; `all` runs from the group's first register. */
export function currentPeriod(kind: PeriodKind, today: DayKey, firstDay: DayKey): Period {
  switch (kind) {
    case 'day':
      return dayPeriod(today)
    case 'week':
      return weekPeriod(today)
    case 'month':
      return monthPeriod(today)
    case 'all':
      return allPeriod(firstDay, today)
  }
}
