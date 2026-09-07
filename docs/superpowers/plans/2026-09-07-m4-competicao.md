# M4 — Competição (Ranking e Histórico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All four questions are answerable — who won today, this week, this month, ever — plus who has the better average; and Histórico shows what happened before.

**Architecture:** Two new tabs computed entirely from the local entries mirror that M3 built — no migration, no new Supabase queries, no server aggregation (spec §9 "Local-first"). **(1) Pure selectors in `src/lib/`:** `rankings.ts` grows from today-only to any `Period` (totals, standings, ties, shares); new `averages.ts` (days-elapsed divisor, best day, days registered), `calendar.ts` (five fill steps, Monday-first month grid) and `wrapup.ts` (last month's verdict); `periods.ts`/`dates.ts`/`format.ts` gain the helpers those need. **(2) Two small primitives** — `Segmented` and `Stepper` — serve both the period control and the month/member controls. **(3) One shared hook** `useGroupData` bundles session → group → members → entries for every tab, and the register list leaves Hoje's card as `EntryList` so Histórico's day detail reuses it with edit/delete intact. Realtime and sync already patch the mirror, so both tabs update live for free.

**Tech Stack:** React 19, TypeScript strict, TanStack Query 5 (unchanged), Tailwind v4 tokens, Vitest + React Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-11-gymfishes-design.md` — the binding spec. Sections used heavily: §4 (time rules), §5.3 (Ranking), §5.4 (Histórico), §8 (design system), §9 (local-first), §15 (testing), §16 (structure). Task 13 aligns the spec's wording with the calls below.

## Calls the spec leaves open (settled here, spec updated in Task 13)

1. **The `›` arrow is disabled at the current period.** You never step into the future; a past period enables it again.
2. **Day labels read "Hoje", "Ontem", then the full date** ("sexta, 7 de agosto"). Months outside the current year read "Julho de 2025"; the all-time label adds the year the same way.
3. **Ties share the position** (1, 1, 3) and every tied leader gets the yellow badge. A tied month wrap-up says "Empate".
4. **The wrap-up shows any time during the following month until dismissed**, one `localStorage` key per month (`gymfishes:wrapup:YYYY-MM`). Tracking "first open" would be extra state for the same result.
5. **The comparison card renders one column per member, "Você" first, for every period including Hoje.** Hiding it for single days would be an extra rule; the numbers are simply degenerate (1 de 1).
6. **Calendar fill steps are opacity steps of the water token** (`bg-water/25`, `/50`, `/75`, `bg-water`) on the surface, not four new colour tokens.
7. **Histórico opens on "Você". Days after today are blank**, like days before the group's first register.
8. **Placeholders carried from M2:** the fish column is the 🐟 emoji until M5; no streak chip.

## Global Constraints

Every task's requirements implicitly include all of these:

- UI is pt-BR only. Every user-visible string lives in `src/lib/strings.ts` — no loose strings in JSX. Numbers use decimal comma via `formatVolume`.
- Date math only in `src/lib/dates.ts` and `src/lib/periods.ts`. Timezone fixed `America/Sao_Paulo` (`APP_TZ`). Weeks start Monday. Other modules may *call* those helpers, never re-derive dates.
- Colors only via tokens in `src/styles/tokens.css`. Dark theme only. Flat: no gradients, no glow, no shadows on surfaces. Beyond blue only green (confirm), yellow (streak / first place) and red (delete) exist.
- TypeScript `strict` + `noUncheckedIndexedAccess`. No `any`.
- A file passing ~200 lines is doing too much — split it.
- Pure logic gets Vitest unit tests, written test-first (TDD). Components are tested through roles and pt-BR text, never implementation.
- Components never import `supabase` directly — data flows through hooks in `src/features/*`.
- `src/lib/database.types.ts` is generated. Never edit by hand.
- `npm run test:run` and `npm run typecheck` must be green before every commit. Never commit with a failing test.
- Touch targets never below 44px.
- **The cloud database is the only database.** M4 needs no migration; if one becomes necessary, create a new one, never edit applied ones. NEVER print or overwrite `.env.local`.
- Simplicity wins. When two designs work, ship the leaner one and say so.
- Commands run in Git Bash from the repo root. Run a single test file with `npx vitest run <path>`.

## File Map

**New:**
- `src/lib/averages.ts` + `averages.test.ts` — `MemberStats`, `statsFor`
- `src/lib/calendar.ts` + `calendar.test.ts` — `FillStep`, `fillStep`, `monthCells`
- `src/lib/wrapup.ts` + `wrapup.test.ts` — `WrapUp`, `monthWrapUp`, `wrapUpStorageKey`
- `src/ui/Segmented.tsx` + `Segmented.test.tsx` — pressed-button group
- `src/ui/Stepper.tsx` + `Stepper.test.tsx` — `‹ label ›` row
- `src/features/group/useGroupData.ts` + `useGroupData.test.ts` — `useGroupData`, `selfFirst`
- `src/screens/hoje/EntryList.tsx` — the register list extracted from `RegistersCard`
- `src/screens/ranking/PeriodControl.tsx` + test, `Standings.tsx` + test, `StatsCompare.tsx` + test, `MonthWrapUp.tsx` + test, `Ranking.tsx` + test
- `src/screens/historico/CalendarGrid.tsx` + test, `DayDetail.tsx` + test, `Historico.tsx` + test

**Modified:**
- `src/lib/dates.ts` + `dates.test.ts` — `daysBetween`, `dateAtNoon`
- `src/lib/periods.ts` + `periods.test.ts` — `daysOf`, `daysElapsed`, `currentPeriod`
- `src/lib/rankings.ts` + `rankings.test.ts` — `Standing`, `totalsForPeriod`, `totalsByDay`, `standings`, `firstRegisterDay`; `totalsForDay` delegates
- `src/lib/format.ts` + `format.test.ts` — `formatDayShort`, `formatDayLong`, `formatMonthTitle`, `formatPeriodLabel`
- `src/lib/strings.ts` — `nav.ranking`, `nav.historico`, new `ranking` and `historico` sections
- `src/screens/hoje/Hoje.tsx`, `src/screens/hoje/RegistersCard.tsx` — use `useGroupData` / `EntryList`
- `src/app/routes.tsx` — two new tab entries
- Spec §5.3, §5.4, §16, §18 and `docs/superpowers/plans/ROADMAP.md` (Task 13)

---

### Task 1: Day-count and current-period helpers

**Files:**
- Modify: `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/periods.ts`, `src/lib/periods.test.ts`

**Interfaces:**
- Consumes: existing `DayKey`, `parseDayKey`, `addDays`, `weekdayMon0`, `dayPeriod`, `weekPeriod`, `monthPeriod`, `allPeriod`, `Period`, `PeriodKind`.
- Produces:
  - `daysBetween(a: DayKey, b: DayKey): number` — whole days from `a` to `b`, negative when `b` is earlier
  - `dateAtNoon(k: DayKey): Date` — noon in São Paulo on that day, for Intl formatting
  - `daysOf(p: Period): DayKey[]` — every day of the period in order
  - `daysElapsed(p: Period, today: DayKey): number` — days from the start through `today` or the end, whichever is earlier; 0 before the period starts
  - `currentPeriod(kind: PeriodKind, today: DayKey, firstDay: DayKey): Period`

- [ ] **Step 1: Write the failing dates tests**

Append to `src/lib/dates.test.ts` (add `daysBetween`, `dateAtNoon` to the existing import from `./dates`):

```ts
describe('daysBetween', () => {
  it('counts forward and backward', () => {
    expect(daysBetween('2026-08-10', '2026-08-10')).toBe(0)
    expect(daysBetween('2026-08-10', '2026-08-16')).toBe(6)
    expect(daysBetween('2026-08-16', '2026-08-10')).toBe(-6)
  })

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
    expect(daysBetween('2026-06-12', '2026-08-10')).toBe(59)
  })
})

describe('dateAtNoon', () => {
  it('lands on the same São Paulo day', () => {
    expect(dayKey(dateAtNoon('2026-08-10'))).toBe('2026-08-10')
    expect(dateAtNoon('2026-08-10').toISOString()).toBe('2026-08-10T15:00:00.000Z')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: FAIL — `daysBetween` / `dateAtNoon` are not exported.

- [ ] **Step 3: Implement in `src/lib/dates.ts`**

Add after `weekdayMon0`:

```ts
/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const pa = parseDayKey(a)
  const pb = parseDayKey(b)
  const ta = Date.UTC(pa.y, pa.m - 1, pa.d)
  const tb = Date.UTC(pb.y, pb.m - 1, pb.d)
  return Math.round((tb - ta) / 86_400_000)
}
```

Add at the end of the file (it needs `SP_OFFSET`, declared further down):

```ts
/** Noon in APP_TZ on that day — a safe instant for formatting a DayKey with Intl. */
export function dateAtNoon(k: DayKey): Date {
  return new Date(`${k}T12:00:00${SP_OFFSET}`)
}
```

- [ ] **Step 4: Run dates tests**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing periods tests**

Append to `src/lib/periods.test.ts` (extend the import from `./periods` with `currentPeriod`, `daysElapsed`, `daysOf`):

```ts
describe('daysOf', () => {
  it('lists every day of a week', () => {
    expect(daysOf(weekPeriod('2026-08-10'))).toEqual([
      '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16',
    ])
  })

  it('has 31 days in August', () => {
    expect(daysOf(monthPeriod('2026-08-10'))).toHaveLength(31)
  })
})

describe('daysElapsed', () => {
  it('counts a finished period in full', () => {
    expect(daysElapsed(weekPeriod('2026-08-03'), '2026-08-10')).toBe(7)
  })

  it('counts the current period only up to today', () => {
    expect(daysElapsed(weekPeriod('2026-08-10'), '2026-08-12')).toBe(3)
  })

  it('is one on the first day', () => {
    expect(daysElapsed(monthPeriod('2026-08-01'), '2026-08-01')).toBe(1)
  })

  it('is zero for a period that has not started', () => {
    expect(daysElapsed(monthPeriod('2026-09-01'), '2026-08-31')).toBe(0)
  })

  it('runs from the first register for the all-time period', () => {
    expect(daysElapsed(allPeriod('2026-06-12', '2026-08-10'), '2026-08-10')).toBe(60)
  })
})

describe('currentPeriod', () => {
  it('builds the period of each kind around today', () => {
    expect(currentPeriod('day', '2026-08-12', '2026-06-12')).toEqual(dayPeriod('2026-08-12'))
    expect(currentPeriod('week', '2026-08-12', '2026-06-12')).toEqual(weekPeriod('2026-08-12'))
    expect(currentPeriod('month', '2026-08-12', '2026-06-12')).toEqual(monthPeriod('2026-08-12'))
    expect(currentPeriod('all', '2026-08-12', '2026-06-12')).toEqual(allPeriod('2026-06-12', '2026-08-12'))
  })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/lib/periods.test.ts`
Expected: FAIL — not exported.

- [ ] **Step 7: Implement in `src/lib/periods.ts`**

Change the import line to:

```ts
import { addDays, daysBetween, pad2, parseDayKey, weekdayMon0, type DayKey } from './dates'
```

Append:

```ts
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
```

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/dates.ts src/lib/dates.test.ts src/lib/periods.ts src/lib/periods.test.ts
git commit -m "feat: day-count and current-period helpers"
```

---

### Task 2: Rankings over any period — totals, standings, ties

**Files:**
- Modify: `src/lib/rankings.ts`, `src/lib/rankings.test.ts`

**Interfaces:**
- Consumes: `containsDay`, `dayPeriod`, `Period` from `./periods`.
- Produces:
  - `type Standing = { profileId: string; ml: number; position: number; share: number }`
  - `totalsForPeriod(entries: readonly RankableEntry[], p: Period): Map<string, number>` — ml per member
  - `totalsForDay(entries, day)` — unchanged signature, now delegates
  - `totalsByDay(entries: readonly RankableEntry[], p: Period, profileId: string): Map<DayKey, number>` — one member's ml per day; silent days absent
  - `standings(totals: ReadonlyMap<string, number>, memberIds: readonly string[]): Standing[]` — ordered by ml desc, ties share position, every member present, `share` = ml / leader ml (0 when leader is 0)
  - `firstRegisterDay(entries: readonly RankableEntry[]): DayKey | undefined`

- [ ] **Step 1: Write the failing tests**

Replace the imports at the top of `src/lib/rankings.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { monthPeriod, weekPeriod } from './periods'
import { firstRegisterDay, standings, totalsByDay, totalsForDay, totalsForPeriod } from './rankings'
```

Keep the existing `e` helper and `totalsForDay` tests, then append:

```ts
describe('totalsForPeriod', () => {
  it('sums per member inside the period, ignoring outside days and deleted rows', () => {
    const week = weekPeriod('2026-08-10')
    const totals = totalsForPeriod(
      [
        e('a', 500, '2026-08-10'),
        e('a', 300, '2026-08-16'),
        e('a', 900, '2026-08-09'),
        e('b', 250, '2026-08-12'),
        e('b', 999, '2026-08-12', '2026-08-12T13:00:00Z'),
      ],
      week,
    )
    expect(totals.get('a')).toBe(800)
    expect(totals.get('b')).toBe(250)
  })
})

describe('totalsByDay', () => {
  it('groups one member by day', () => {
    const m = totalsByDay(
      [e('a', 500, '2026-08-10'), e('a', 300, '2026-08-10'), e('a', 700, '2026-08-12'), e('b', 900, '2026-08-12')],
      monthPeriod('2026-08-01'),
      'a',
    )
    expect([...m.entries()]).toEqual([
      ['2026-08-10', 800],
      ['2026-08-12', 700],
    ])
  })
})

describe('standings', () => {
  it('orders by volume descending with shares of the leader', () => {
    expect(standings(new Map([['a', 1000], ['b', 4000]]), ['a', 'b'])).toEqual([
      { profileId: 'b', ml: 4000, position: 1, share: 1 },
      { profileId: 'a', ml: 1000, position: 2, share: 0.25 },
    ])
  })

  it('lists silent members at zero', () => {
    expect(standings(new Map([['a', 1000]]), ['a', 'b'])[1]).toEqual({
      profileId: 'b',
      ml: 0,
      position: 2,
      share: 0,
    })
  })

  it('shares the position on a tie and keeps member order', () => {
    const rows = standings(new Map([['a', 1000], ['b', 1000], ['c', 500]]), ['a', 'b', 'c'])
    expect(rows.map((r) => [r.profileId, r.position])).toEqual([['a', 1], ['b', 1], ['c', 3]])
  })

  it('has zero shares and a shared first position when nobody registered', () => {
    expect(standings(new Map(), ['a', 'b']).every((r) => r.share === 0 && r.position === 1)).toBe(true)
  })
})

describe('firstRegisterDay', () => {
  it('finds the earliest live day', () => {
    expect(
      firstRegisterDay([
        e('a', 1, '2026-08-10'),
        e('b', 1, '2026-06-12'),
        e('a', 1, '2026-01-01', '2026-01-02T00:00:00Z'),
      ]),
    ).toBe('2026-06-12')
  })

  it('is undefined with no registers', () => {
    expect(firstRegisterDay([])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/rankings.test.ts`
Expected: FAIL — new functions are not exported.

- [ ] **Step 3: Rewrite `src/lib/rankings.ts`**

```ts
import type { DayKey } from './dates'
import { containsDay, dayPeriod, type Period } from './periods'

export type RankableEntry = {
  profile_id: string
  total_ml: number
  drank_on: string
  deleted_at: string | null
}

/** One row of the standings. `position` is shared on ties (1, 1, 3); `share` is ml over the leader's ml. */
export type Standing = { profileId: string; ml: number; position: number; share: number }

function live(entries: readonly RankableEntry[], p: Period): RankableEntry[] {
  return entries.filter((e) => !e.deleted_at && containsDay(p, e.drank_on))
}

/** Volume per member inside the period. Soft-deleted rows are ignored. */
export function totalsForPeriod(entries: readonly RankableEntry[], p: Period): Map<string, number> {
  const totals = new Map<string, number>()
  for (const e of live(entries, p)) {
    totals.set(e.profile_id, (totals.get(e.profile_id) ?? 0) + e.total_ml)
  }
  return totals
}

/** Volume per member for one calendar day. */
export function totalsForDay(entries: readonly RankableEntry[], day: DayKey): Map<string, number> {
  return totalsForPeriod(entries, dayPeriod(day))
}

/** One member's volume per day inside the period; days without registers are absent. */
export function totalsByDay(
  entries: readonly RankableEntry[],
  p: Period,
  profileId: string,
): Map<DayKey, number> {
  const totals = new Map<DayKey, number>()
  for (const e of live(entries, p)) {
    if (e.profile_id !== profileId) continue
    totals.set(e.drank_on, (totals.get(e.drank_on) ?? 0) + e.total_ml)
  }
  return totals
}

/** Members ordered by volume, ties sharing a position. Every member appears, at 0 ml if silent. */
export function standings(
  totals: ReadonlyMap<string, number>,
  memberIds: readonly string[],
): Standing[] {
  const rows = memberIds
    .map((id) => ({ profileId: id, ml: totals.get(id) ?? 0 }))
    .sort((a, b) => b.ml - a.ml)
  const leader = rows[0]?.ml ?? 0
  let position = 0
  let prevMl = -1
  return rows.map((r, i) => {
    if (r.ml !== prevMl) {
      position = i + 1
      prevMl = r.ml
    }
    return { ...r, position, share: leader > 0 ? r.ml / leader : 0 }
  })
}

/** Earliest day with a live register — the start of the all-time period (spec §4 "Total"). */
export function firstRegisterDay(entries: readonly RankableEntry[]): DayKey | undefined {
  let first: DayKey | undefined
  for (const e of entries) {
    if (e.deleted_at) continue
    if (first === undefined || e.drank_on < first) first = e.drank_on
  }
  return first
}
```

`Array.prototype.sort` is stable, so tied members keep their `joined_at` order from the roster.

- [ ] **Step 4: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS (ProgressStrip still uses `totalsForDay` with the same signature).

- [ ] **Step 5: Commit**

```bash
git add src/lib/rankings.ts src/lib/rankings.test.ts
git commit -m "feat: rankings over periods with standings and ties"
```

---

### Task 3: Averages and records

**Files:**
- Create: `src/lib/averages.ts`, `src/lib/averages.test.ts`

**Interfaces:**
- Consumes: `daysElapsed`, `containsDay`, `Period` (Task 1 / existing); `totalsByDay`, `RankableEntry` (Task 2).
- Produces:
  - `type MemberStats = { totalMl: number; averageMl: number; bestDay: { day: DayKey; ml: number } | null; daysRegistered: number; daysElapsed: number; registers: number }`
  - `statsFor(entries: readonly RankableEntry[], p: Period, today: DayKey, profileId: string): MemberStats`

- [ ] **Step 1: Write the failing tests**

`src/lib/averages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { statsFor } from './averages'
import { weekPeriod } from './periods'

const e = (profile_id: string, total_ml: number, drank_on: string, deleted_at: string | null = null) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at,
})

const week = weekPeriod('2026-08-10') // 10–16 de agosto
const entries = [
  e('a', 2000, '2026-08-10'),
  e('a', 1000, '2026-08-10'),
  e('a', 4000, '2026-08-12'),
  e('b', 500, '2026-08-11'),
  e('a', 9000, '2026-08-05'), // last week
  e('a', 9000, '2026-08-13', '2026-08-13T20:00:00Z'), // deleted
]

describe('statsFor', () => {
  it('divides by days elapsed, not days registered', () => {
    const s = statsFor(entries, week, '2026-08-13', 'a')
    expect(s.totalMl).toBe(7000)
    expect(s.daysElapsed).toBe(4)
    expect(s.daysRegistered).toBe(2)
    expect(s.averageMl).toBe(1750)
  })

  it('finds the best day and counts registers', () => {
    const s = statsFor(entries, week, '2026-08-13', 'a')
    expect(s.bestDay).toEqual({ day: '2026-08-12', ml: 4000 })
    expect(s.registers).toBe(3)
  })

  it('breaks a best-day tie towards the earlier day', () => {
    const s = statsFor([e('a', 1000, '2026-08-12'), e('a', 1000, '2026-08-10')], week, '2026-08-16', 'a')
    expect(s.bestDay).toEqual({ day: '2026-08-10', ml: 1000 })
  })

  it('is all zeros for a silent member', () => {
    expect(statsFor(entries, week, '2026-08-13', 'c')).toEqual({
      totalMl: 0,
      averageMl: 0,
      bestDay: null,
      daysRegistered: 0,
      daysElapsed: 4,
      registers: 0,
    })
  })

  it('uses the full length of a finished period', () => {
    expect(statsFor(entries, weekPeriod('2026-08-03'), '2026-08-13', 'a').daysElapsed).toBe(7)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/averages.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/averages.ts`**

```ts
import type { DayKey } from './dates'
import { containsDay, daysElapsed, type Period } from './periods'
import { totalsByDay, type RankableEntry } from './rankings'

export type MemberStats = {
  totalMl: number
  /** Total over days *elapsed*, not days registered — skipping a day costs you (spec §5.3). */
  averageMl: number
  bestDay: { day: DayKey; ml: number } | null
  daysRegistered: number
  daysElapsed: number
  registers: number
}

/** The "Médias e recordes" column for one member in one period. */
export function statsFor(
  entries: readonly RankableEntry[],
  p: Period,
  today: DayKey,
  profileId: string,
): MemberStats {
  const byDay = totalsByDay(entries, p, profileId)
  let totalMl = 0
  let bestDay: MemberStats['bestDay'] = null
  for (const [day, ml] of byDay) {
    totalMl += ml
    if (!bestDay || ml > bestDay.ml || (ml === bestDay.ml && day < bestDay.day)) bestDay = { day, ml }
  }
  const elapsed = daysElapsed(p, today)
  const registers = entries.filter(
    (e) => !e.deleted_at && e.profile_id === profileId && containsDay(p, e.drank_on),
  ).length
  return {
    totalMl,
    averageMl: elapsed > 0 ? Math.round(totalMl / elapsed) : 0,
    bestDay,
    daysRegistered: byDay.size,
    daysElapsed: elapsed,
    registers,
  }
}
```

- [ ] **Step 4: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/averages.ts src/lib/averages.test.ts
git commit -m "feat: member averages and records"
```

---

### Task 4: M4 strings and pt-BR period labels

**Files:**
- Modify: `src/lib/strings.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `addDays`, `dateAtNoon`, `parseDayKey`, `APP_TZ` (dates); `Period` (periods).
- Produces:
  - Every `STRINGS.nav.*`, `STRINGS.ranking.*`, `STRINGS.historico.*` key listed in Step 3 — later tasks reference them by these exact names
  - `formatDayShort(k: DayKey): string` — "7 ago"
  - `formatDayLong(k: DayKey): string` — "segunda, 10 de agosto"
  - `formatMonthTitle(k: DayKey, today: DayKey): string` — "Agosto" / "Agosto de 2025"
  - `formatPeriodLabel(p: Period, today: DayKey): string` — the label between the arrows

- [ ] **Step 1: Write the failing tests**

Replace the import lines at the top of `src/lib/format.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { formatDateLong, formatDayLong, formatDayShort, formatMonthTitle, formatPeriodLabel, formatTime, formatVolume } from './format'
import { allPeriod, dayPeriod, monthPeriod, weekPeriod } from './periods'
```

Append:

```ts
describe('formatDayShort', () => {
  it('renders day and short month without the dot', () => {
    expect(formatDayShort('2026-08-07')).toBe('7 ago')
    expect(formatDayShort('2026-01-15')).toBe('15 jan')
  })
})

describe('formatDayLong', () => {
  it('renders from a DayKey', () => {
    expect(formatDayLong('2026-08-10')).toBe('segunda, 10 de agosto')
  })
})

describe('formatMonthTitle', () => {
  it('capitalises the month', () => {
    expect(formatMonthTitle('2026-07-01', '2026-08-10')).toBe('Julho')
  })

  it('adds the year outside the current one', () => {
    expect(formatMonthTitle('2025-07-01', '2026-08-10')).toBe('Julho de 2025')
  })
})

describe('formatPeriodLabel', () => {
  const today = '2026-08-10'

  it('names today, yesterday, then the full date', () => {
    expect(formatPeriodLabel(dayPeriod('2026-08-10'), today)).toBe('Hoje')
    expect(formatPeriodLabel(dayPeriod('2026-08-09'), today)).toBe('Ontem')
    expect(formatPeriodLabel(dayPeriod('2026-08-07'), today)).toBe('sexta, 7 de agosto')
  })

  it('renders a week inside one month', () => {
    expect(formatPeriodLabel(weekPeriod('2026-08-04'), today)).toBe('Semana de 3–9 de agosto')
  })

  it('renders a week across two months', () => {
    expect(formatPeriodLabel(weekPeriod('2026-07-28'), today)).toBe('Semana de 27 de julho–2 de agosto')
  })

  it('renders a month', () => {
    expect(formatPeriodLabel(monthPeriod('2026-07-15'), today)).toBe('Julho')
  })

  it('renders all-time from the first register', () => {
    expect(formatPeriodLabel(allPeriod('2026-06-12', today), today)).toBe('Desde 12 de junho')
    expect(formatPeriodLabel(allPeriod('2025-06-12', today), today)).toBe('Desde 12 de junho de 2025')
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — not exported.

- [ ] **Step 3: Add the M4 strings to `src/lib/strings.ts`**

Replace the `nav` section with:

```ts
  nav: {
    hoje: 'Hoje',
    ranking: 'Ranking',
    historico: 'Histórico',
    perfil: 'Perfil',
    registrarAgua: 'Registrar água',
  },
```

Add two new sections after `nav`:

```ts
  ranking: {
    titulo: 'Ranking',
    periodo: 'Período',
    periodos: { day: 'Hoje', week: 'Semana', month: 'Mês', all: 'Total' },
    hoje: 'Hoje',
    ontem: 'Ontem',
    semanaDe: (intervalo: string) => `Semana de ${intervalo}`,
    desde: (data: string) => `Desde ${data}`,
    anterior: 'Período anterior',
    proximo: 'Próximo período',
    nadaRegistrado: 'Nada registrado neste período',
    mediasERecordes: 'Médias e recordes',
    mediaPorDia: 'Média por dia',
    melhorDia: 'Melhor dia',
    diasRegistrados: 'Dias registrados',
    registros: 'Registros',
    de: (a: number, b: number) => `${a} de ${b}`,
    semDados: '—',
    encerrado: (mes: string) => `${mes} encerrado`,
    venceu: (nome: string) => `${nome} venceu 🏆`,
    empate: 'Empate',
    versus: ' × ',
    fechar: 'Fechar',
  },
  historico: {
    titulo: 'Histórico',
    membro: 'Membro',
    mesAnterior: 'Mês anterior',
    proximoMes: 'Próximo mês',
    diasSemana: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    nenhumRegistro: 'Nenhum registro neste dia',
    rodape: (mes: string, total: string, media: string, dias: string) =>
      `${mes}: ${total} · média ${media}/dia · ${dias} dias`,
  },
```

The whole `STRINGS` object already ends in `as const`, so `periodos` is indexable by `PeriodKind` and `diasSemana` is a readonly tuple.

- [ ] **Step 4: Implement the formatters in `src/lib/format.ts`**

Replace the first import line with:

```ts
import { addDays, APP_TZ, dateAtNoon, parseDayKey, type DayKey } from './dates'
import type { Period } from './periods'
import { STRINGS } from './strings'
```

Append at the end of the file:

```ts
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
```

- [ ] **Step 5: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/strings.ts src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: pt-BR period labels and M4 strings"
```

---

### Task 5: `Segmented` and `Stepper` primitives

**Files:**
- Create: `src/ui/Segmented.tsx`, `src/ui/Segmented.test.tsx`, `src/ui/Stepper.tsx`, `src/ui/Stepper.test.tsx`

**Interfaces:**
- Produces:
  - `Segmented<T extends string>({ options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string })` — a `role="group"` of buttons with `aria-pressed`
  - `Stepper({ label: string; prevLabel: string; nextLabel: string; nextDisabled: boolean; onPrev: () => void; onNext: () => void })` — `‹ label ›`, 44px arrows

- [ ] **Step 1: Write the failing Segmented test**

`src/ui/Segmented.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Segmented } from './Segmented'

const options = [
  { value: 'day', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
] as const

describe('Segmented', () => {
  it('marks the selected option pressed', () => {
    render(<Segmented label="Período" options={options} value="day" onChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semana', pressed: false })).toBeInTheDocument()
  })

  it('reports the tapped value', async () => {
    const onChange = vi.fn()
    render(<Segmented label="Período" options={options} value="day" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    expect(onChange).toHaveBeenCalledWith('week')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/ui/Segmented.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/ui/Segmented.tsx`**

```tsx
type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

/** Flat segmented control: selected segment is a water-filled pill, the rest are quiet text. */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
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
            className={`min-h-[44px] flex-1 rounded-key text-[13px] font-extrabold ${
              selected ? 'bg-water text-ink-on-water' : 'text-ink-2'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run Segmented test**

Run: `npx vitest run src/ui/Segmented.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing Stepper test**

`src/ui/Stepper.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

function setup(nextDisabled = false) {
  const onPrev = vi.fn()
  const onNext = vi.fn()
  render(
    <Stepper
      label="Julho"
      prevLabel="Anterior"
      nextLabel="Próximo"
      nextDisabled={nextDisabled}
      onPrev={onPrev}
      onNext={onNext}
    />,
  )
  return { onPrev, onNext }
}

describe('Stepper', () => {
  it('shows the label and steps both ways', async () => {
    const { onPrev, onNext } = setup()
    expect(screen.getByText('Julho')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('disables the forward arrow on demand', () => {
    setup(true)
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/ui/Stepper.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/ui/Stepper.tsx`**

```tsx
type Props = {
  label: string
  prevLabel: string
  nextLabel: string
  nextDisabled: boolean
  onPrev: () => void
  onNext: () => void
}

const ARROW = 'min-h-[44px] min-w-[44px] text-[24px] font-extrabold text-ink-2 disabled:opacity-40'

/** `‹ label ›` — the period and month steppers (spec §5.3, §5.4). */
export function Stepper({ label, prevLabel, nextLabel, nextDisabled, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" aria-label={prevLabel} onClick={onPrev} className={ARROW}>
        ‹
      </button>
      <p className="text-[15px] font-bold">{label}</p>
      <button type="button" aria-label={nextLabel} onClick={onNext} disabled={nextDisabled} className={ARROW}>
        ›
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/ui/Segmented.tsx src/ui/Segmented.test.tsx src/ui/Stepper.tsx src/ui/Stepper.test.tsx
git commit -m "feat: Segmented and Stepper primitives"
```

---

### Task 6: Shared `useGroupData` hook and reusable `EntryList`

**Files:**
- Create: `src/features/group/useGroupData.ts`, `src/features/group/useGroupData.test.ts`, `src/screens/hoje/EntryList.tsx`
- Modify: `src/screens/hoje/Hoje.tsx`, `src/screens/hoje/RegistersCard.tsx`

**Interfaces:**
- Consumes: `useSession` (`@/features/auth/AuthProvider`), `useBootstrap` (`@/features/profile/useBootstrap`), `useMembers`/`Member` (`./queries`), `useEntries` (`@/features/entries/queries`), `Entry` (`@/features/entries/cache`), `useEntryOps` (`@/features/entries/mutations`), `useOutboxStatus` (`@/features/entries/outboxStore`), `EntryRow`.
- Produces:
  - `useGroupData(): { userId: string | undefined; groupId: string | null | undefined; members: Member[]; entries: Entry[] }`
  - `selfFirst(members: readonly Member[], userId: string): Member[]` — "Você" first, others in roster order
  - `EntryList({ userId: string; groupId: string; members: Member[]; entries: Entry[]; openRegister: (entry: Entry) => void; empty: string })` — the compact rows with pending/failed state and edit/delete on own rows; renders `empty` text when the list is empty

- [ ] **Step 1: Write the failing `selfFirst` test**

`src/features/group/useGroupData.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Member } from './queries'
import { selfFirst } from './useGroupData'

const m = (id: string): Member => ({ id, display_name: id, fish_variant: 'guppy', accent: 'blue', joined_at: id })

describe('selfFirst', () => {
  it('moves me to the front and keeps the rest in order', () => {
    expect(selfFirst([m('a'), m('b'), m('me'), m('c')], 'me').map((x) => x.id)).toEqual(['me', 'a', 'b', 'c'])
  })

  it('leaves the list alone when I am not in it', () => {
    expect(selfFirst([m('a'), m('b')], 'me').map((x) => x.id)).toEqual(['a', 'b'])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/group/useGroupData.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/features/group/useGroupData.ts`**

```ts
import { useSession } from '@/features/auth/AuthProvider'
import type { Entry } from '@/features/entries/cache'
import { useEntries } from '@/features/entries/queries'
import { useBootstrap } from '@/features/profile/useBootstrap'
import { useMembers, type Member } from './queries'

const NO_MEMBERS: Member[] = []
const NO_ENTRIES: Entry[] = []

export type GroupData = {
  userId: string | undefined
  groupId: string | null | undefined
  members: Member[]
  entries: Entry[]
}

/** The chain every tab needs: who am I → which group → who's in it → what they drank. */
export function useGroupData(): GroupData {
  const { session } = useSession()
  const userId = session?.user.id
  const bootstrap = useBootstrap(userId)
  const groupId = bootstrap.data?.groupId
  const members = useMembers(groupId)
  const entries = useEntries(groupId)
  return {
    userId,
    groupId,
    members: members.data ?? NO_MEMBERS,
    entries: entries.data ?? NO_ENTRIES,
  }
}

/** "Você" always comes first in any member list (spec §5.1, §5.3, §5.4). */
export function selfFirst(members: readonly Member[], userId: string): Member[] {
  return [...members].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/features/group/useGroupData.test.ts`
Expected: PASS

- [ ] **Step 5: Extract `EntryList` from `RegistersCard`**

Create `src/screens/hoje/EntryList.tsx`:

```tsx
import type { Entry } from '@/features/entries/cache'
import { useEntryOps } from '@/features/entries/mutations'
import { useOutboxStatus } from '@/features/entries/outboxStore'
import type { Member } from '@/features/group/queries'
import { STRINGS } from '@/lib/strings'
import { EntryRow } from './EntryRow'

type Props = {
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
  empty: string
}

/** The compact register list from Hoje, reused by Histórico's day detail (spec §5.4). */
export function EntryList({ userId, groupId, members, entries, openRegister, empty }: Props) {
  const ops = useEntryOps(groupId, userId)
  const status = useOutboxStatus()
  const nameOf = (id: string) =>
    id === userId
      ? STRINGS.hoje.voce
      : (members.find((m) => m.id === id)?.display_name ?? STRINGS.hoje.alguem)

  if (entries.length === 0) {
    return <p className="py-4 text-center text-[13px] text-ink-2">{empty}</p>
  }
  return (
    <ul>
      {entries.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          authorName={nameOf(entry.profile_id)}
          isOwn={entry.profile_id === userId}
          pending={status.pending.has(entry.id)}
          failed={status.failed.has(entry.id)}
          onEdit={() => openRegister(entry)}
          onDelete={() => ops.remove(entry)}
          onRetry={() => ops.retry(entry.id)}
        />
      ))}
    </ul>
  )
}
```

Replace `src/screens/hoje/RegistersCard.tsx` with:

```tsx
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import { EntryList } from './EntryList'

type Props = {
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
}

export function RegistersCard({ userId, groupId, members, entries, openRegister }: Props) {
  const today = dayKey(new Date())
  const todays = entries.filter((e) => e.drank_on === today)

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.hoje.registrosDeHoje} · {todays.length}
      </h2>
      <EntryList
        userId={userId}
        groupId={groupId}
        members={members}
        entries={todays}
        openRegister={openRegister}
        empty={STRINGS.hoje.vazio}
      />
    </section>
  )
}
```

- [ ] **Step 6: Make Hoje use the shared hook**

Replace `src/screens/hoje/Hoje.tsx` with:

```tsx
import { useNavigate, useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { useGroupData } from '@/features/group/useGroupData'
import { STRINGS } from '@/lib/strings'
import { formatDateLong } from '@/lib/format'
import { ProgressStrip } from './ProgressStrip'
import { RegistersCard } from './RegistersCard'
import { SyncPill } from './SyncPill'

export function Hoje() {
  const { userId, groupId, members, entries } = useGroupData()
  const navigate = useNavigate()
  const { openRegister } = useOutletContext<ShellContext>()

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 flex items-start justify-between px-1">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.hoje.titulo}</h1>
          <p className="mt-1 text-[10px] text-ink-3">{formatDateLong(new Date())}</p>
          <SyncPill groupId={groupId} />
        </div>
        <button
          type="button"
          aria-label={STRINGS.hoje.abrirPerfil}
          onClick={() => navigate('/perfil')}
          className="min-h-[44px] min-w-[44px] text-[24px]"
        >
          🐟
        </button>
      </header>
      {userId ? <ProgressStrip userId={userId} members={members} entries={entries} /> : null}
      {userId && groupId ? (
        <RegistersCard
          userId={userId}
          groupId={groupId}
          members={members}
          entries={entries}
          openRegister={openRegister}
        />
      ) : null}
    </div>
  )
}
```

`Hoje.test.tsx` keeps passing unchanged: it mocks the same underlying modules the hook now imports.

- [ ] **Step 7: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS — `Hoje.test.tsx` and `EntryRow.test.tsx` are the behavioural coverage for this refactor.

- [ ] **Step 8: Commit**

```bash
git add src/features/group/useGroupData.ts src/features/group/useGroupData.test.ts src/screens/hoje/EntryList.tsx src/screens/hoje/RegistersCard.tsx src/screens/hoje/Hoje.tsx
git commit -m "refactor: shared useGroupData hook and reusable EntryList"
```

---

### Task 7: Ranking — `PeriodControl` and `Standings`

**Files:**
- Create: `src/screens/ranking/PeriodControl.tsx`, `src/screens/ranking/PeriodControl.test.tsx`, `src/screens/ranking/Standings.tsx`, `src/screens/ranking/Standings.test.tsx`

**Interfaces:**
- Consumes: `Segmented`, `Stepper` (Task 5); `formatPeriodLabel` (Task 4); `containsDay`, `currentPeriod`, `stepPeriod`, `Period`, `PeriodKind` (Task 1 / existing); `Standing` (Task 2); `Member`; `ACCENT_TEXT`, `accentOf`; `formatVolume`.
- Produces:
  - `PeriodControl({ period: Period; today: DayKey; firstDay: DayKey; onChange: (period: Period) => void })`
  - `Standings({ rows: Standing[]; members: Member[]; userId: string })`

- [ ] **Step 1: Write the failing PeriodControl test**

`src/screens/ranking/PeriodControl.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { allPeriod, dayPeriod, weekPeriod, type Period } from '@/lib/periods'
import { PeriodControl } from './PeriodControl'

const today = '2026-08-10'

function setup(period: Period = dayPeriod(today)) {
  const onChange = vi.fn()
  render(<PeriodControl period={period} today={today} firstDay="2026-06-12" onChange={onChange} />)
  return onChange
}

describe('PeriodControl', () => {
  it('opens on Hoje with the forward arrow disabled', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Hoje', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Hoje', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo período' })).toBeDisabled()
  })

  it('steps back a day', async () => {
    const onChange = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
    expect(onChange).toHaveBeenCalledWith(dayPeriod('2026-08-09'))
  })

  it('switches to the current week', async () => {
    const onChange = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    expect(onChange).toHaveBeenCalledWith(weekPeriod(today))
  })

  it('labels a past week and enables the forward arrow', () => {
    setup(weekPeriod('2026-08-03'))
    expect(screen.getByText('Semana de 3–9 de agosto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo período' })).toBeEnabled()
  })

  it('hides the arrows for Total', () => {
    setup(allPeriod('2026-06-12', today))
    expect(screen.getByText('Desde 12 de junho')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Período anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Próximo período' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/ranking/PeriodControl.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/screens/ranking/PeriodControl.tsx`**

```tsx
import type { DayKey } from '@/lib/dates'
import { formatPeriodLabel } from '@/lib/format'
import { containsDay, currentPeriod, stepPeriod, type Period, type PeriodKind } from '@/lib/periods'
import { STRINGS } from '@/lib/strings'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'

const KINDS: readonly PeriodKind[] = ['day', 'week', 'month', 'all']

type Props = {
  period: Period
  today: DayKey
  firstDay: DayKey
  onChange: (period: Period) => void
}

/** `Hoje | Semana | Mês | Total` plus `‹ ›` (spec §5.3). Forward never passes today; Total has no arrows. */
export function PeriodControl({ period, today, firstDay, onChange }: Props) {
  const label = formatPeriodLabel(period, today)
  return (
    <div>
      <Segmented
        label={STRINGS.ranking.periodo}
        options={KINDS.map((k) => ({ value: k, label: STRINGS.ranking.periodos[k] }))}
        value={period.kind}
        onChange={(kind) => onChange(currentPeriod(kind, today, firstDay))}
      />
      <div className="mt-3">
        {period.kind === 'all' ? (
          <p className="flex min-h-[44px] items-center justify-center text-[15px] font-bold">{label}</p>
        ) : (
          <Stepper
            label={label}
            prevLabel={STRINGS.ranking.anterior}
            nextLabel={STRINGS.ranking.proximo}
            nextDisabled={containsDay(period, today)}
            onPrev={() => onChange(stepPeriod(period, -1))}
            onNext={() => onChange(stepPeriod(period, 1))}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run PeriodControl test**

Run: `npx vitest run src/screens/ranking/PeriodControl.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing Standings test**

`src/screens/ranking/Standings.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Member } from '@/features/group/queries'
import { Standings } from './Standings'

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
]

describe('Standings', () => {
  it('lists members in order with positions, names and totals', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u2', ml: 2300, position: 1, share: 1 },
          { profileId: 'u1', ml: 1800, position: 2, share: 0.78 },
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]!).getByText('1')).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('Ana')
    expect(items[0]).toHaveTextContent('2,3 L')
    expect(within(items[1]!).getByText('2')).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('Você')
    expect(items[1]).toHaveTextContent('1,8 L')
  })

  it('shows the empty state when nobody registered', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u1', ml: 0, position: 1, share: 0 },
          { profileId: 'u2', ml: 0, position: 1, share: 0 },
        ]}
      />,
    )
    expect(screen.getByText('Nada registrado neste período')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('gives both tied members the first position', () => {
    render(
      <Standings
        userId="u1"
        members={members}
        rows={[
          { profileId: 'u1', ml: 1000, position: 1, share: 1 },
          { profileId: 'u2', ml: 1000, position: 1, share: 1 },
        ]}
      />,
    )
    expect(screen.getAllByText('1')).toHaveLength(2)
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/screens/ranking/Standings.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/screens/ranking/Standings.tsx`**

```tsx
import type { Member } from '@/features/group/queries'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import { formatVolume } from '@/lib/format'
import type { Standing } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'

type Props = { rows: Standing[]; members: Member[]; userId: string }

/**
 * `[position] [fish] [name] [bar] [total]` (spec §5.3). The bar is each member's share of
 * the leader; first place is a flat yellow badge — no crown, no glow. 🐟 is the M5 placeholder.
 */
export function Standings({ rows, members, userId }: Props) {
  if (rows.every((r) => r.ml === 0)) {
    return <p className="py-6 text-center text-[13px] text-ink-2">{STRINGS.ranking.nadaRegistrado}</p>
  }
  return (
    <ol className="mt-3">
      {rows.map((r) => {
        const member = members.find((m) => m.id === r.profileId)
        const name = r.profileId === userId ? STRINGS.hoje.voce : (member?.display_name ?? STRINGS.hoje.alguem)
        const first = r.position === 1
        return (
          <li key={r.profileId} className="flex min-h-[44px] items-center gap-3 py-1">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                first ? 'bg-streak text-ink-on-water' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {r.position}
            </span>
            <span aria-hidden className="text-[17px]">
              🐟
            </span>
            <span
              className={`w-16 shrink-0 truncate text-[13px] font-extrabold ${ACCENT_TEXT[accentOf(member?.accent ?? 'blue')]}`}
            >
              {name}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-[99px] bg-surface-2">
              <span className="block h-full rounded-[99px] bg-water" style={{ width: `${Math.round(r.share * 100)}%` }} />
            </span>
            <span className="shrink-0 text-[17px] font-extrabold tracking-[-0.4px] text-water">
              {formatVolume(r.ml)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
```

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/screens/ranking/PeriodControl.tsx src/screens/ranking/PeriodControl.test.tsx src/screens/ranking/Standings.tsx src/screens/ranking/Standings.test.tsx
git commit -m "feat: Ranking period control and standings"
```

---

### Task 8: Ranking — "Médias e recordes" comparison card

**Files:**
- Create: `src/screens/ranking/StatsCompare.tsx`, `src/screens/ranking/StatsCompare.test.tsx`

**Interfaces:**
- Consumes: `MemberStats` (Task 3); `selfFirst` (Task 6); `formatDayShort`, `formatVolume` (Task 4 / existing); `ACCENT_TEXT`, `accentOf`; `Member`.
- Produces: `StatsCompare({ members: Member[]; userId: string; stats: ReadonlyMap<string, MemberStats> })`

- [ ] **Step 1: Write the failing test**

`src/screens/ranking/StatsCompare.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Member } from '@/features/group/queries'
import type { MemberStats } from '@/lib/averages'
import { StatsCompare } from './StatsCompare'

const members: Member[] = [
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '1' },
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '2' },
]

const mine: MemberStats = {
  totalMl: 21_600,
  averageMl: 2400,
  bestDay: { day: '2026-08-07', ml: 4200 },
  daysRegistered: 9,
  daysElapsed: 10,
  registers: 41,
}
const hers: MemberStats = {
  totalMl: 29_000,
  averageMl: 2900,
  bestDay: { day: '2026-08-02', ml: 3800 },
  daysRegistered: 10,
  daysElapsed: 10,
  registers: 58,
}

describe('StatsCompare', () => {
  it('shows one column per member, Você first, with every row', () => {
    render(<StatsCompare userId="u1" members={members} stats={new Map([['u1', mine], ['u2', hers]])} />)
    expect(screen.getByText('Médias e recordes')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Você', 'Ana'])
    expect(screen.getByText('Média por dia').closest('tr')).toHaveTextContent('2,4 L')
    expect(screen.getByText('Média por dia').closest('tr')).toHaveTextContent('2,9 L')
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('4,2 L (7 ago)')
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('3,8 L (2 ago)')
    expect(screen.getByText('Dias registrados').closest('tr')).toHaveTextContent('9 de 10')
    expect(screen.getByText('Registros').closest('tr')).toHaveTextContent('41')
    expect(screen.getByText('Registros').closest('tr')).toHaveTextContent('58')
  })

  it('shows a dash for a member with no best day', () => {
    render(<StatsCompare userId="u1" members={members} stats={new Map([['u1', mine]])} />)
    expect(screen.getByText('Melhor dia').closest('tr')).toHaveTextContent('—')
    expect(screen.getByText('Dias registrados').closest('tr')).toHaveTextContent('0 de 0')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/ranking/StatsCompare.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/screens/ranking/StatsCompare.tsx`**

```tsx
import type { Member } from '@/features/group/queries'
import { selfFirst } from '@/features/group/useGroupData'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import type { MemberStats } from '@/lib/averages'
import { formatDayShort, formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

type Props = { members: Member[]; userId: string; stats: ReadonlyMap<string, MemberStats> }

const EMPTY: MemberStats = {
  totalMl: 0,
  averageMl: 0,
  bestDay: null,
  daysRegistered: 0,
  daysElapsed: 0,
  registers: 0,
}

const ROWS: readonly [string, (s: MemberStats) => string][] = [
  [STRINGS.ranking.mediaPorDia, (s) => formatVolume(s.averageMl)],
  [
    STRINGS.ranking.melhorDia,
    (s) => (s.bestDay ? `${formatVolume(s.bestDay.ml)} (${formatDayShort(s.bestDay.day)})` : STRINGS.ranking.semDados),
  ],
  [STRINGS.ranking.diasRegistrados, (s) => STRINGS.ranking.de(s.daysRegistered, s.daysElapsed)],
  [STRINGS.ranking.registros, (s) => String(s.registers)],
]

/** One column per member (spec §5.3, §18) — a third member is a column, not a rewrite. */
export function StatsCompare({ members, userId, stats }: Props) {
  const ordered = selfFirst(members, userId)
  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.ranking.mediasERecordes}
      </h2>
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            <td />
            {ordered.map((m) => (
              <th
                key={m.id}
                scope="col"
                className={`pb-2 text-right text-[9px] font-extrabold uppercase tracking-[1px] ${ACCENT_TEXT[accentOf(m.accent)]}`}
              >
                {m.id === userId ? STRINGS.hoje.voce : m.display_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, render]) => (
            <tr key={label} className="border-t border-line">
              <th scope="row" className="py-2 text-left font-bold text-ink-2">
                {label}
              </th>
              {ordered.map((m) => (
                <td key={m.id} className="py-2 text-right font-extrabold">
                  {render(stats.get(m.id) ?? EMPTY)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
```

- [ ] **Step 4: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/ranking/StatsCompare.tsx src/screens/ranking/StatsCompare.test.tsx
git commit -m "feat: Ranking medias-e-recordes comparison card"
```

---

### Task 9: Month wrap-up — pure verdict and dismissible card

**Files:**
- Create: `src/lib/wrapup.ts`, `src/lib/wrapup.test.ts`, `src/screens/ranking/MonthWrapUp.tsx`, `src/screens/ranking/MonthWrapUp.test.tsx`

**Interfaces:**
- Consumes: `monthPeriod`, `stepPeriod`, `Period`; `standings`, `totalsForPeriod`, `Standing`, `RankableEntry` (Task 2); `formatMonthTitle`, `formatVolume` (Task 4); `Entry`, `Member`.
- Produces:
  - `type WrapUp = { period: Period; rows: Standing[]; winnerId: string | null }`
  - `monthWrapUp(entries: readonly RankableEntry[], memberIds: readonly string[], today: DayKey): WrapUp | null` — null when last month has no registers; `winnerId` null on a tie
  - `wrapUpStorageKey(period: Period): string` — `gymfishes:wrapup:YYYY-MM`
  - `MonthWrapUp({ entries: Entry[]; members: Member[]; userId: string; today: DayKey })` — renders nothing when there is no verdict or it was dismissed on this device

- [ ] **Step 1: Write the failing pure tests**

`src/lib/wrapup.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { monthPeriod } from './periods'
import { monthWrapUp, wrapUpStorageKey } from './wrapup'

const e = (profile_id: string, total_ml: number, drank_on: string) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at: null,
})

describe('monthWrapUp', () => {
  it('names last month winner with totals in standings order', () => {
    const w = monthWrapUp(
      [e('a', 68_400, '2026-07-10'), e('b', 61_200, '2026-07-20'), e('b', 5000, '2026-08-01')],
      ['a', 'b'],
      '2026-08-10',
    )
    expect(w?.period.start).toBe('2026-07-01')
    expect(w?.winnerId).toBe('a')
    expect(w?.rows.map((r) => r.ml)).toEqual([68_400, 61_200])
  })

  it('is null when last month is empty', () => {
    expect(monthWrapUp([e('a', 500, '2026-08-01')], ['a', 'b'], '2026-08-10')).toBeNull()
  })

  it('has no winner on a tie', () => {
    const w = monthWrapUp([e('a', 500, '2026-07-01'), e('b', 500, '2026-07-02')], ['a', 'b'], '2026-08-10')
    expect(w?.winnerId).toBeNull()
  })

  it('looks at December from January', () => {
    expect(monthWrapUp([e('a', 500, '2025-12-31')], ['a'], '2026-01-05')?.period).toEqual({
      kind: 'month',
      start: '2025-12-01',
      end: '2025-12-31',
    })
  })
})

describe('wrapUpStorageKey', () => {
  it('is one key per month', () => {
    expect(wrapUpStorageKey(monthPeriod('2026-07-15'))).toBe('gymfishes:wrapup:2026-07')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/wrapup.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/wrapup.ts`**

```ts
import type { DayKey } from './dates'
import { monthPeriod, stepPeriod, type Period } from './periods'
import { standings, totalsForPeriod, type RankableEntry, type Standing } from './rankings'

export type WrapUp = { period: Period; rows: Standing[]; winnerId: string | null }

/** Last month's result, or null when nobody registered in it (spec §5.3). A tie has no winner. */
export function monthWrapUp(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  today: DayKey,
): WrapUp | null {
  const period = stepPeriod(monthPeriod(today), -1)
  const rows = standings(totalsForPeriod(entries, period), memberIds)
  const [first, second] = rows
  if (!first || first.ml === 0) return null
  return { period, rows, winnerId: second && second.ml === first.ml ? null : first.profileId }
}

/** One key per month, per device — deliberately unsynced (spec §5.3). */
export function wrapUpStorageKey(period: Period): string {
  return `gymfishes:wrapup:${period.start.slice(0, 7)}`
}
```

- [ ] **Step 4: Run the pure tests**

Run: `npx vitest run src/lib/wrapup.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

`src/screens/ranking/MonthWrapUp.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { MonthWrapUp } from './MonthWrapUp'

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
]

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) =>
  ({
    id,
    profile_id,
    group_id: 'g1',
    total_ml,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: `${drank_on}T15:00:00+00:00`,
    drank_on,
    created_at: `${drank_on}T15:00:00+00:00`,
    updated_at: `${drank_on}T15:00:00+00:00`,
    deleted_at: null,
  }) as Entry

const july = [row('e1', 'u1', 68_400, '2026-07-10'), row('e2', 'u2', 61_200, '2026-07-20')]
const today = '2026-08-10'

describe('MonthWrapUp', () => {
  beforeEach(() => localStorage.clear())

  it('announces last month winner and both totals', () => {
    render(<MonthWrapUp entries={july} members={members} userId="u2" today={today} />)
    expect(screen.getByText('Julho encerrado — Leo venceu 🏆')).toBeInTheDocument()
    expect(screen.getByText('68,4 L × 61,2 L')).toBeInTheDocument()
  })

  it('says Você when you won', () => {
    render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    expect(screen.getByText('Julho encerrado — Você venceu 🏆')).toBeInTheDocument()
  })

  it('says Empate on a tie', () => {
    const tie = [row('e1', 'u1', 1000, '2026-07-10'), row('e2', 'u2', 1000, '2026-07-20')]
    render(<MonthWrapUp entries={tie} members={members} userId="u1" today={today} />)
    expect(screen.getByText('Julho encerrado — Empate')).toBeInTheDocument()
  })

  it('hides after dismissal and stays hidden on the next mount', async () => {
    const first = render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByText(/Julho encerrado/)).toBeNull()
    expect(localStorage.getItem('gymfishes:wrapup:2026-07')).toBe('1')
    first.unmount()
    render(<MonthWrapUp entries={july} members={members} userId="u1" today={today} />)
    expect(screen.queryByText(/Julho encerrado/)).toBeNull()
  })

  it('renders nothing when last month is empty', () => {
    const { container } = render(<MonthWrapUp entries={[]} members={members} userId="u1" today={today} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/screens/ranking/MonthWrapUp.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/screens/ranking/MonthWrapUp.tsx`**

```tsx
import { useState } from 'react'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import type { DayKey } from '@/lib/dates'
import { formatMonthTitle, formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { monthWrapUp, wrapUpStorageKey } from '@/lib/wrapup'

type Props = { entries: Entry[]; members: Member[]; userId: string; today: DayKey }

function isDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function remember(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // storage blocked (private mode): the card simply returns on the next open — harmless
  }
}

/**
 * "Julho encerrado — Ela venceu 🏆" at the top of Ranking during the following month, until
 * dismissed on this device (spec §5.3). Not synced on purpose.
 */
export function MonthWrapUp({ entries, members, userId, today }: Props) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const wrap = monthWrapUp(entries, members.map((m) => m.id), today)
  if (!wrap) return null
  const key = wrapUpStorageKey(wrap.period)
  if (dismissedKey === key || isDismissed(key)) return null

  const nameOf = (id: string) =>
    id === userId ? STRINGS.hoje.voce : (members.find((m) => m.id === id)?.display_name ?? STRINGS.hoje.alguem)
  const result = wrap.winnerId ? STRINGS.ranking.venceu(nameOf(wrap.winnerId)) : STRINGS.ranking.empate

  return (
    <section className="mb-3 flex items-start justify-between rounded-card border border-line bg-surface p-4">
      <div>
        <p className="text-[15px] font-extrabold">
          {STRINGS.ranking.encerrado(formatMonthTitle(wrap.period.start, today))} — {result}
        </p>
        <p className="mt-1 text-[20px] font-extrabold tracking-[-0.4px] text-water">
          {wrap.rows.map((r) => formatVolume(r.ml)).join(STRINGS.ranking.versus)}
        </p>
      </div>
      <button
        type="button"
        aria-label={STRINGS.ranking.fechar}
        onClick={() => {
          remember(key)
          setDismissedKey(key)
        }}
        className="-mr-2 -mt-2 min-h-[44px] min-w-[44px] text-[20px] text-ink-2"
      >
        ×
      </button>
    </section>
  )
}
```

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/wrapup.ts src/lib/wrapup.test.ts src/screens/ranking/MonthWrapUp.tsx src/screens/ranking/MonthWrapUp.test.tsx
git commit -m "feat: month wrap-up card with per-device dismissal"
```

---

### Task 10: The Ranking tab

**Files:**
- Create: `src/screens/ranking/Ranking.tsx`, `src/screens/ranking/Ranking.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: `useGroupData` (Task 6); `statsFor`, `MemberStats` (Task 3); `dayKey`; `dayPeriod`, `Period`; `firstRegisterDay`, `standings`, `totalsForPeriod` (Task 2); `MonthWrapUp` (Task 9), `PeriodControl`, `Standings` (Task 7), `StatsCompare` (Task 8); `STRINGS.nav.ranking`, `STRINGS.ranking.titulo`.
- Produces: `Ranking()` screen mounted at `/ranking`.

- [ ] **Step 1: Write the failing integration test**

`src/screens/ranking/Ranking.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import { Ranking } from './Ranking'

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({ data: { profile: { id: 'u1' }, groupId: 'g1' } }),
}))
vi.mock('@/features/group/queries', () => ({
  useMembers: () => ({
    data: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
  }),
}))

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) => ({
  id,
  profile_id,
  group_id: 'g1',
  total_ml,
  composition: [],
  note: null,
  photo_path: null,
  thumb_path: null,
  drank_at: `${drank_on}T15:00:00+00:00`,
  drank_on,
  created_at: `${drank_on}T15:00:00+00:00`,
  updated_at: `${drank_on}T15:00:00+00:00`,
  deleted_at: null,
})
vi.mock('@/features/entries/queries', () => ({
  useEntries: () => ({
    data: [
      row('e1', 'u1', 1800, '2026-08-10'),
      row('e2', 'u2', 2300, '2026-08-10'),
      row('e3', 'u1', 3000, '2026-08-03'),
      row('e4', 'u2', 500, '2026-07-15'),
    ],
  }),
}))

function renderRanking() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Ranking />} />
    </Routes>,
  )
}

describe('Ranking', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-10T15:00:00Z')) // segunda, 10 de agosto, meio-dia em São Paulo
    localStorage.clear()
  })
  afterEach(() => vi.useRealTimers())

  it('ranks today by default with the leader first', () => {
    renderRanking()
    expect(screen.getByRole('heading', { name: 'Ranking' })).toBeInTheDocument()
    expect(screen.getByText('Hoje', { selector: 'p' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Ana')
    expect(items[0]).toHaveTextContent('2,3 L')
    expect(items[1]).toHaveTextContent('Você')
  })

  it('steps back to last week', async () => {
    renderRanking()
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
    await userEvent.click(screen.getByRole('button', { name: 'Período anterior' }))
    expect(screen.getByText('Semana de 3–9 de agosto')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Você')
    expect(items[0]).toHaveTextContent('3 L')
  })

  it('shows all-time since the first register', async () => {
    renderRanking()
    await userEvent.click(screen.getByRole('button', { name: 'Total' }))
    expect(screen.getByText('Desde 15 de julho')).toBeInTheDocument()
  })

  it('shows the July wrap-up and the comparison card', () => {
    renderRanking()
    expect(screen.getByText('Julho encerrado — Ana venceu 🏆')).toBeInTheDocument()
    expect(screen.getByText('Médias e recordes')).toBeInTheDocument()
  })
})
```

Only `Date` is faked, so `userEvent`'s internal timers keep working.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/ranking/Ranking.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/screens/ranking/Ranking.tsx`**

```tsx
import { useState } from 'react'
import { useGroupData } from '@/features/group/useGroupData'
import { statsFor, type MemberStats } from '@/lib/averages'
import { dayKey } from '@/lib/dates'
import { dayPeriod, type Period } from '@/lib/periods'
import { firstRegisterDay, standings, totalsForPeriod } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { MonthWrapUp } from './MonthWrapUp'
import { PeriodControl } from './PeriodControl'
import { Standings } from './Standings'
import { StatsCompare } from './StatsCompare'

/** Answers "who is winning" and nothing else (spec §5.3). Everything is derived from the mirror. */
export function Ranking() {
  const { userId, members, entries } = useGroupData()
  const today = dayKey(new Date())
  const [period, setPeriod] = useState<Period>(() => dayPeriod(today))
  if (!userId) return null

  const firstDay = firstRegisterDay(entries) ?? today
  const ids = members.map((m) => m.id)
  const rows = standings(totalsForPeriod(entries, period), ids)
  const stats = new Map<string, MemberStats>(
    ids.map((id): [string, MemberStats] => [id, statsFor(entries, period, today, id)]),
  )

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.ranking.titulo}</h1>
      </header>
      <MonthWrapUp entries={entries} members={members} userId={userId} today={today} />
      <section className="rounded-card border border-line bg-surface p-4">
        <PeriodControl period={period} today={today} firstDay={firstDay} onChange={setPeriod} />
        <Standings rows={rows} members={members} userId={userId} />
      </section>
      <StatsCompare members={members} userId={userId} stats={stats} />
    </div>
  )
}
```

- [ ] **Step 4: Register the tab**

In `src/app/routes.tsx`, add the import and the route between Hoje and Perfil:

```tsx
import { Ranking } from '@/screens/ranking/Ranking'
```

```tsx
export const TAB_ROUTES: TabRoute[] = [
  { path: '/hoje', label: STRINGS.nav.hoje, icon: '💧', element: <Hoje /> },
  { path: '/ranking', label: STRINGS.nav.ranking, icon: '🏆', element: <Ranking /> },
  { path: '/perfil', label: STRINGS.nav.perfil, icon: '🐠', element: <Perfil /> },
]
```

Also update the doc comment above it to: `Later milestones add tabs by appending here.` The tab bar splits the table in half around the + button, so the layout is momentarily two-left / one-right until Task 12 adds Histórico.

- [ ] **Step 5: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS — `TabBar.test.tsx` iterates `TAB_ROUTES` and picks the new tab up automatically.

- [ ] **Step 6: Look at it**

Run: `npm run dev`, open the app, tap **Ranking**. Check: segmented control, `‹ ›` with the forward arrow dimmed on the current period, yellow "1" badge on the leader, bar widths, the comparison table, and (if last month has registers) the wrap-up card that stays gone after ×. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/screens/ranking/Ranking.tsx src/screens/ranking/Ranking.test.tsx src/app/routes.tsx
git commit -m "feat: Ranking tab"
```

---

### Task 11: Histórico — calendar steps and `CalendarGrid`

**Files:**
- Create: `src/lib/calendar.ts`, `src/lib/calendar.test.ts`, `src/screens/historico/CalendarGrid.tsx`, `src/screens/historico/CalendarGrid.test.tsx`

**Interfaces:**
- Consumes: `weekdayMon0`, `parseDayKey`, `DayKey`; `daysOf`, `Period` (Task 1); `formatDayLong` (Task 4); `STRINGS.historico.diasSemana`.
- Produces:
  - `type FillStep = 0 | 1 | 2 | 3 | 4`; `fillStep(ml: number): FillStep`
  - `monthCells(month: Period): (DayKey | null)[]` — leading `null`s so the 1st sits under its weekday, Monday first
  - `CalendarGrid({ period: Period; totals: ReadonlyMap<DayKey, number>; today: DayKey; firstDay: DayKey | undefined; selected: DayKey | null; onSelect: (day: DayKey) => void })` — each day is a 44px button named by `formatDayLong`, `aria-pressed` when selected, `data-step` with its fill step, disabled (blank) before `firstDay` and after `today`

- [ ] **Step 1: Write the failing pure tests**

`src/lib/calendar.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fillStep, monthCells } from './calendar'
import { monthPeriod } from './periods'

describe('fillStep', () => {
  it('maps totals to the five flat steps', () => {
    expect(fillStep(0)).toBe(0)
    expect(fillStep(1)).toBe(1)
    expect(fillStep(999)).toBe(1)
    expect(fillStep(1000)).toBe(2)
    expect(fillStep(1999)).toBe(2)
    expect(fillStep(2000)).toBe(3)
    expect(fillStep(2999)).toBe(3)
    expect(fillStep(3000)).toBe(4)
    expect(fillStep(9000)).toBe(4)
  })
})

describe('monthCells', () => {
  it('pads August 2026 with five blanks — it starts on a Saturday', () => {
    const cells = monthCells(monthPeriod('2026-08-01'))
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, '2026-08-01'])
    expect(cells).toHaveLength(36)
    expect(cells.at(-1)).toBe('2026-08-31')
  })

  it('has no blanks when the month starts on a Monday', () => {
    expect(monthCells(monthPeriod('2026-06-01'))[0]).toBe('2026-06-01')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/calendar.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/calendar.ts`**

```ts
import { weekdayMon0, type DayKey } from './dates'
import { daysOf, type Period } from './periods'

export type FillStep = 0 | 1 | 2 | 3 | 4

/** Five flat steps for a day's total (spec §5.4): none, <1 L, 1–2 L, 2–3 L, 3 L and up. */
export function fillStep(ml: number): FillStep {
  if (ml <= 0) return 0
  if (ml < 1000) return 1
  if (ml < 2000) return 2
  if (ml < 3000) return 3
  return 4
}

/** A month laid out Monday-first: leading nulls pad the first week, then every day in order. */
export function monthCells(month: Period): (DayKey | null)[] {
  return [...Array<null>(weekdayMon0(month.start)).fill(null), ...daysOf(month)]
}
```

- [ ] **Step 4: Run the pure tests**

Run: `npx vitest run src/lib/calendar.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

`src/screens/historico/CalendarGrid.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DayKey } from '@/lib/dates'
import { monthPeriod } from '@/lib/periods'
import { CalendarGrid } from './CalendarGrid'

const month = monthPeriod('2026-08-01')
const today = '2026-08-10'
const totals = new Map<DayKey, number>([
  ['2026-08-03', 1500],
  ['2026-08-07', 3200],
])

function setup(selected: DayKey | null = null) {
  const onSelect = vi.fn()
  render(
    <CalendarGrid
      period={month}
      totals={totals}
      today={today}
      firstDay="2026-08-02"
      selected={selected}
      onSelect={onSelect}
    />,
  )
  return onSelect
}

describe('CalendarGrid', () => {
  it('renders every day of the month', () => {
    setup()
    expect(screen.getByRole('button', { name: 'sábado, 1 de agosto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'segunda, 31 de agosto' })).toBeInTheDocument()
  })

  it('fills days by step', () => {
    setup()
    expect(screen.getByRole('button', { name: 'segunda, 3 de agosto' })).toHaveAttribute('data-step', '2')
    expect(screen.getByRole('button', { name: 'sexta, 7 de agosto' })).toHaveAttribute('data-step', '4')
    expect(screen.getByRole('button', { name: 'terça, 4 de agosto' })).toHaveAttribute('data-step', '0')
  })

  it('blanks days before the first register and after today', () => {
    setup()
    expect(screen.getByRole('button', { name: 'sábado, 1 de agosto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'terça, 11 de agosto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'segunda, 10 de agosto' })).toBeEnabled()
  })

  it('reports the tapped day', async () => {
    const onSelect = setup()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 3 de agosto' }))
    expect(onSelect).toHaveBeenCalledWith('2026-08-03')
  })

  it('marks the selected day pressed', () => {
    setup('2026-08-03')
    expect(screen.getByRole('button', { name: 'segunda, 3 de agosto', pressed: true })).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/screens/historico/CalendarGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/screens/historico/CalendarGrid.tsx`**

```tsx
import { fillStep, monthCells, type FillStep } from '@/lib/calendar'
import { parseDayKey, type DayKey } from '@/lib/dates'
import { formatDayLong } from '@/lib/format'
import type { Period } from '@/lib/periods'
import { STRINGS } from '@/lib/strings'

type Props = {
  period: Period
  totals: ReadonlyMap<DayKey, number>
  today: DayKey
  firstDay: DayKey | undefined
  selected: DayKey | null
  onSelect: (day: DayKey) => void
}

/** Five flat steps of the water token — discrete, never a gradient (spec §5.4). */
const FILL: Record<FillStep, string> = {
  0: 'bg-surface-2 text-ink',
  1: 'bg-water/25 text-ink',
  2: 'bg-water/50 text-ink',
  3: 'bg-water/75 text-ink-on-water',
  4: 'bg-water text-ink-on-water',
}

export function CalendarGrid({ period, totals, today, firstDay, selected, onSelect }: Props) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1">
      {STRINGS.historico.diasSemana.map((d, i) => (
        <span key={i} className="text-center text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {d}
        </span>
      ))}
      {monthCells(period).map((day, i) => {
        if (!day) return <span key={`blank-${i}`} />
        const blank = firstDay === undefined || day < firstDay || day > today
        const step = fillStep(totals.get(day) ?? 0)
        const border =
          day === selected ? 'border-2 border-ink' : day === today ? 'border border-water' : 'border border-transparent'
        return (
          <button
            key={day}
            type="button"
            disabled={blank}
            aria-label={formatDayLong(day)}
            aria-pressed={day === selected}
            data-step={blank ? undefined : step}
            onClick={() => onSelect(day)}
            className={`flex min-h-[44px] items-center justify-center rounded-key text-[13px] font-bold ${border} ${
              blank ? 'text-ink-3' : FILL[step]
            }`}
          >
            {parseDayKey(day).d}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts src/screens/historico/CalendarGrid.tsx src/screens/historico/CalendarGrid.test.tsx
git commit -m "feat: Historico calendar grid with five fill steps"
```

---

### Task 12: The Histórico tab — `DayDetail`, screen, route

**Files:**
- Create: `src/screens/historico/DayDetail.tsx`, `src/screens/historico/DayDetail.test.tsx`, `src/screens/historico/Historico.tsx`, `src/screens/historico/Historico.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: `EntryList`, `useGroupData`, `selfFirst` (Task 6); `CalendarGrid` (Task 11); `Segmented`, `Stepper` (Task 5); `statsFor` (Task 3); `totalsForDay`, `totalsByDay`, `firstRegisterDay` (Task 2); `formatDayLong`, `formatMonthTitle`, `formatVolume` (Task 4); `containsDay`, `monthPeriod`, `stepPeriod`, `Period`; `dayKey`; `ShellContext`.
- Produces:
  - `DayDetail({ day: DayKey; userId: string; groupId: string; members: Member[]; entries: Entry[]; openRegister: (entry: Entry) => void })`
  - `Historico()` screen mounted at `/historico`

- [ ] **Step 1: Write the failing DayDetail test**

`src/screens/historico/DayDetail.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { DayDetail } from './DayDetail'

vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), retry: vi.fn() }),
}))
vi.mock('@/features/entries/outboxStore', () => ({
  useOutboxStatus: () => ({ pending: new Set(), failed: new Set(), queued: new Set() }),
}))

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
]

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) =>
  ({
    id,
    profile_id,
    group_id: 'g1',
    total_ml,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: `${drank_on}T15:00:00+00:00`,
    drank_on,
    created_at: `${drank_on}T15:00:00+00:00`,
    updated_at: `${drank_on}T15:00:00+00:00`,
    deleted_at: null,
  }) as Entry

const entries = [row('e1', 'u1', 1800, '2026-08-10'), row('e2', 'u2', 2300, '2026-08-10'), row('e3', 'u1', 3000, '2026-08-03')]

describe('DayDetail', () => {
  it('shows the day, both totals and that day rows only', () => {
    renderWithProviders(
      <DayDetail day="2026-08-10" userId="u1" groupId="g1" members={members} entries={entries} openRegister={vi.fn()} />,
    )
    expect(screen.getByText('segunda, 10 de agosto')).toBeInTheDocument()
    expect(screen.getByText('Você 1,8 L · Ana 2,3 L')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument()
  })

  it('shows the empty text on a day without registers', () => {
    renderWithProviders(
      <DayDetail day="2026-08-05" userId="u1" groupId="g1" members={members} entries={entries} openRegister={vi.fn()} />,
    )
    expect(screen.getByText('Você 0 ml · Ana 0 ml')).toBeInTheDocument()
    expect(screen.getByText('Nenhum registro neste dia')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/historico/DayDetail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/screens/historico/DayDetail.tsx`**

```tsx
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { selfFirst } from '@/features/group/useGroupData'
import type { DayKey } from '@/lib/dates'
import { formatDayLong, formatVolume } from '@/lib/format'
import { totalsForDay } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { EntryList } from '@/screens/hoje/EntryList'

type Props = {
  day: DayKey
  userId: string
  groupId: string
  members: Member[]
  entries: Entry[]
  openRegister: (entry: Entry) => void
}

/** Both members' totals for the day plus the full register list, reusing Hoje's rows (spec §5.4). */
export function DayDetail({ day, userId, groupId, members, entries, openRegister }: Props) {
  const rows = entries.filter((e) => e.drank_on === day)
  const totals = totalsForDay(entries, day)
  const summary = selfFirst(members, userId)
    .map((m) => `${m.id === userId ? STRINGS.hoje.voce : m.display_name} ${formatVolume(totals.get(m.id) ?? 0)}`)
    .join(' · ')

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">{formatDayLong(day)}</h2>
      <p className="mt-1 mb-2 text-[13px] font-bold text-ink-2">{summary}</p>
      <EntryList
        userId={userId}
        groupId={groupId}
        members={members}
        entries={rows}
        openRegister={openRegister}
        empty={STRINGS.historico.nenhumRegistro}
      />
    </section>
  )
}
```

- [ ] **Step 4: Run DayDetail test**

Run: `npx vitest run src/screens/historico/DayDetail.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing Historico integration test**

`src/screens/historico/Historico.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet, Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import { Historico } from './Historico'

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({ data: { profile: { id: 'u1' }, groupId: 'g1' } }),
}))
vi.mock('@/features/group/queries', () => ({
  useMembers: () => ({
    data: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
  }),
}))
vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), retry: vi.fn() }),
}))
vi.mock('@/features/entries/outboxStore', () => ({
  useOutboxStatus: () => ({ pending: new Set(), failed: new Set(), queued: new Set() }),
}))

const row = (id: string, profile_id: string, total_ml: number, drank_on: string) => ({
  id,
  profile_id,
  group_id: 'g1',
  total_ml,
  composition: [],
  note: null,
  photo_path: null,
  thumb_path: null,
  drank_at: `${drank_on}T15:00:00+00:00`,
  drank_on,
  created_at: `${drank_on}T15:00:00+00:00`,
  updated_at: `${drank_on}T15:00:00+00:00`,
  deleted_at: null,
})
vi.mock('@/features/entries/queries', () => ({
  useEntries: () => ({
    data: [
      row('e1', 'u1', 1800, '2026-08-10'),
      row('e2', 'u2', 2300, '2026-08-10'),
      row('e3', 'u1', 3000, '2026-08-03'),
      row('e4', 'u2', 500, '2026-07-15'),
    ],
  }),
}))

function renderHistorico() {
  return renderWithProviders(
    <Routes>
      <Route element={<Outlet context={{ openRegister: vi.fn() }} />}>
        <Route path="/" element={<Historico />} />
      </Route>
    </Routes>,
  )
}

describe('Historico', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-10T15:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('opens on your own current month with the footer', () => {
    renderHistorico()
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Você', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Agosto', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Agosto: 4,8 L · média 480 ml/dia · 2 de 10 dias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
  })

  it('switches to the partner', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'Ana' }))
    expect(screen.getByText('Agosto: 2,3 L · média 230 ml/dia · 1 de 10 dias')).toBeInTheDocument()
  })

  it('opens a day detail with both totals and the rows', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 10 de agosto' }))
    expect(screen.getByText('Você 1,8 L · Ana 2,3 L')).toBeInTheDocument()
    expect(screen.getByText(/Ana ·/)).toBeInTheDocument()
  })

  it('steps back a month and clears the selected day', async () => {
    renderHistorico()
    await userEvent.click(screen.getByRole('button', { name: 'segunda, 3 de agosto' }))
    expect(screen.getByText('Você 3 L · Ana 0 ml')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('Julho', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByText('Você 3 L · Ana 0 ml')).toBeNull()
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled()
  })
})
```

Footer arithmetic for the first test: your August is 1 800 + 3 000 = 4 800 ml over 10 elapsed days (1–10 de agosto) = 480 ml/dia, on 2 registered days.

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/screens/historico/Historico.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/screens/historico/Historico.tsx`**

```tsx
import { useState } from 'react'
import { useOutletContext } from 'react-router'
import type { ShellContext } from '@/app/AppShell'
import { selfFirst, useGroupData } from '@/features/group/useGroupData'
import { statsFor } from '@/lib/averages'
import { dayKey, type DayKey } from '@/lib/dates'
import { formatMonthTitle, formatVolume } from '@/lib/format'
import { containsDay, monthPeriod, stepPeriod, type Period } from '@/lib/periods'
import { firstRegisterDay, totalsByDay } from '@/lib/rankings'
import { STRINGS } from '@/lib/strings'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'
import { CalendarGrid } from './CalendarGrid'
import { DayDetail } from './DayDetail'

/** Answers "what happened before" (spec §5.4): one member's month at a glance, any day in detail. */
export function Historico() {
  const { userId, groupId, members, entries } = useGroupData()
  const { openRegister } = useOutletContext<ShellContext>()
  const today = dayKey(new Date())
  const [memberId, setMemberId] = useState<string | null>(null)
  const [month, setMonth] = useState<Period>(() => monthPeriod(today))
  const [selected, setSelected] = useState<DayKey | null>(null)
  if (!userId || !groupId) return null

  const shown = memberId ?? userId
  const stats = statsFor(entries, month, today, shown)
  const title = formatMonthTitle(month.start, today)

  function goToMonth(delta: -1 | 1) {
    setMonth(stepPeriod(month, delta))
    setSelected(null)
  }

  return (
    <div className="px-3 pt-2">
      <header className="mb-4 px-1">
        <h1 className="text-[20px] font-extrabold tracking-tight">{STRINGS.historico.titulo}</h1>
      </header>
      <section className="rounded-card border border-line bg-surface p-4">
        <Segmented
          label={STRINGS.historico.membro}
          options={selfFirst(members, userId).map((m) => ({
            value: m.id,
            label: m.id === userId ? STRINGS.hoje.voce : m.display_name,
          }))}
          value={shown}
          onChange={setMemberId}
        />
        <div className="mt-3">
          <Stepper
            label={title}
            prevLabel={STRINGS.historico.mesAnterior}
            nextLabel={STRINGS.historico.proximoMes}
            nextDisabled={containsDay(month, today)}
            onPrev={() => goToMonth(-1)}
            onNext={() => goToMonth(1)}
          />
        </div>
        <CalendarGrid
          period={month}
          totals={totalsByDay(entries, month, shown)}
          today={today}
          firstDay={firstRegisterDay(entries)}
          selected={selected}
          onSelect={setSelected}
        />
        <p className="mt-3 text-center text-[13px] font-bold text-ink-2">
          {STRINGS.historico.rodape(
            title,
            formatVolume(stats.totalMl),
            formatVolume(stats.averageMl),
            STRINGS.ranking.de(stats.daysRegistered, stats.daysElapsed),
          )}
        </p>
      </section>
      {selected ? (
        <DayDetail
          day={selected}
          userId={userId}
          groupId={groupId}
          members={members}
          entries={entries}
          openRegister={openRegister}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 8: Register the tab**

In `src/app/routes.tsx` add the import and insert the route between Ranking and Perfil so the final order is Hoje, Ranking, Histórico, Perfil:

```tsx
import { Historico } from '@/screens/historico/Historico'
```

```tsx
export const TAB_ROUTES: TabRoute[] = [
  { path: '/hoje', label: STRINGS.nav.hoje, icon: '💧', element: <Hoje /> },
  { path: '/ranking', label: STRINGS.nav.ranking, icon: '🏆', element: <Ranking /> },
  { path: '/historico', label: STRINGS.nav.historico, icon: '📅', element: <Historico /> },
  { path: '/perfil', label: STRINGS.nav.perfil, icon: '🐠', element: <Perfil /> },
]
```

The tab bar now reads `Hoje  Ranking  (+)  Histórico  Perfil` — the spec §5 layout.

- [ ] **Step 9: Run all tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 10: Look at it**

Run: `npm run dev`, open **Histórico**. Check: the Você/partner toggle, the month stepper with the forward arrow dimmed, five visibly distinct flat fills, today's blue border, blank days before the first register and after today, a tapped day showing the detail card with your rows expandable and editable, the footer line. Then open Hoje and confirm its register list is unchanged. Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add src/screens/historico/DayDetail.tsx src/screens/historico/DayDetail.test.tsx src/screens/historico/Historico.tsx src/screens/historico/Historico.test.tsx src/app/routes.tsx
git commit -m "feat: Historico tab with day detail and month footer"
```

---

### Task 13: Docs — spec alignment and roadmap status

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (§5.3, §5.4, §16, §18), `docs/superpowers/plans/ROADMAP.md`

- [ ] **Step 1: Align spec §5.3**

In the **Period control** paragraph, after the sentence ending `("Semana de 4–10 de agosto", "Julho", "Desde 12 de junho")`, add:

```
The `›` arrow is disabled while the current period is shown — there is no future to step
into. A single day is labelled "Hoje", "Ontem", then the full date ("sexta, 7 de agosto").
Months outside the current year carry it ("Julho de 2025"), as does the all-time label.
```

In the **Standings** paragraph, after `First place is marked with a flat first-place treatment (yellow position badge); no crowns, no glow.` add:

```
Tied members share a position (1, 1, 3) and every tied leader gets the badge.
```

Replace the **Month wrap-up** opening sentence

```
**Month wrap-up** — on the first open of a new month, if the previous month has registers,
a dismissible card appears at the top of Ranking:
```

with

```
**Month wrap-up** — during a month, if the previous month has registers, a dismissible card
sits at the top of Ranking until it is dismissed (a tie reads "Empate"):
```

Replace `Dismissal is stored per device in `localStorage`.` with `Dismissal is stored per device in `localStorage`, one key per month (`gymfishes:wrapup:YYYY-MM`).`

After the paragraph that follows the comparison table (the one ending `*"quem tem a maior média?"*.`), add a new paragraph:

```
The card is shown for every period, Hoje included; a single day simply reads "1 de 1".
```

- [ ] **Step 2: Align spec §5.4**

Replace `Days before the group's first register are blank.` with `Days before the group's first register, and days after today, are blank. The toggle opens on "Você".`

- [ ] **Step 3: Align spec §16 and §18**

In the §16 tree:
- `hoje/` line: add `EntryList` after `EntryRow`.
- `features/group/` line: `queries.ts joinGroup.ts createGroup.ts useGroupData.ts`
- `lib/` line: add `calendar.ts  wrapup.ts` after `averages.ts`
- `ui/` line: `shadcn primitives + Button, Field, Card, Sheet, Segmented, Stepper, Toast`

In §18, replace

```
  Only the Ranking comparison card assumes two columns and would need to become a list.
```

with

```
  The Ranking comparison card already renders one column per member.
```

- [ ] **Step 4: Update the roadmap**

In `docs/superpowers/plans/ROADMAP.md`, change the M4 row to:

```
| M4 | Competição — Ranking e Histórico | [`2026-09-07-m4-competicao.md`](2026-09-07-m4-competicao.md) | **code-complete** — pending owner verification: step back one week on a real phone and sanity-check the standings; edit a past register from Histórico |
```

Change the M5 row's status from `blocked by M2` to `ready` (M2 is code-complete) and the M6 row's status to `blocked by M5`.

Append to the **M4 — Competição** section, after the bullet list:

```
**Deliberate sequencing note:** the spec's standings row shows the member's fish; M4 ships the
same 🐟 emoji placeholder as Hoje (the 13 SVG fish are M5). No streak chip anywhere yet
(`streaks.ts` is M5). Calls the spec left open — forward arrow disabled at the current period,
"Hoje"/"Ontem" day labels, shared positions on ties, the wrap-up showing all month until
dismissed, one comparison column per member, opacity steps for the calendar fills — are
recorded in the plan and folded into spec §5.3/§5.4.
```

- [ ] **Step 5: Run everything one last time**

Run: `npm run test:run && npm run typecheck && npm run build`
Expected: all PASS, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-11-gymfishes-design.md docs/superpowers/plans/ROADMAP.md
git commit -m "docs: mark M4 code-complete; align spec 5.3/5.4/16/18"
```

---

## Owner verifications (manual, after code-complete)

1. **Ranking on a real phone** — open Ranking, step back one week and one month, compare the standings against what you remember. Switch to Total and check "Desde …" matches your first register.
2. **Edit from Histórico** — tap a past day, expand one of your registers, edit its volume; Hoje's tube (if today), Ranking's totals and the calendar fill all update without a reload.
3. **Wrap-up** — on the first day of next month, the "… encerrado" card appears on each phone once and stays gone after ×.

## Notes for the reviewer

- **Everything is derived.** No table, view or RPC was added. If the mirror is empty (fresh install, offline), Ranking shows "Nada registrado neste período" and Histórico an all-blank month — correct, not broken.
- **Accepted edge:** an entry authored by someone who has since left the group counts toward nothing (standings only list current members). Two-person household.
- **Accepted edge:** the `Hoje` period label turns into "Ontem" if the app stays open across midnight without a re-render trigger — the next tap fixes it, and it is telling the truth.
- **Why `bg-water/25` and friends:** Tailwind v4 opacity modifiers on a token colour keep the "tokens only" rule while avoiding four single-purpose colour tokens. The result is a flat fill; there is no gradient.
- **Why `Stepper` and `Segmented` are in `ui/`:** each is used by two screens. Neither knows about periods or members.
