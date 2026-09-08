# M5 — Peixes e celebrações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crossing a streak milestone unlocks a fish and celebrates exactly once — the thirteen flat SVG fish replace the 🐟 placeholder everywhere, Perfil gets the gallery, onboarding gets the picker, and your own registers earn full-screen, toast and inline celebrations.

**Architecture:** Everything is derived from the local entries mirror M3 built — no migration, no new table, no new query (spec §6 "derived, never stored", §9 "local-first"). **(1) Pure logic:** `lib/streaks.ts` (current and longest streak), `features/fish/catalog.ts` (the thirteen fish and their conditions), `features/fish/unlocks.ts` (all-time facts → unlocked set), `lib/wrapup.ts` grows `monthsWon`, and `features/celebrations/engine.ts` turns a before/after `DayState` into a prioritised `Celebration[]`. **(2) Art:** one `<Fish variant state size />` component renders per-fish path data from `features/fish/svg/`; idle motion is CSS keyframes like the water, so a hidden tube pauses both. **(3) UI:** `FishGrid` serves the Perfil gallery and the onboarding picker; a `CelebrationProvider` in the shell receives the entries list before and after each of your inserts, runs the engine, and shows one full screen, joined toasts, or an inline caption on the Hoje gap line.

**Tech Stack:** React 19, TypeScript strict, TanStack Query 5 (unchanged), `motion` 13 (already a dependency) for the celebration choreography, CSS keyframes for the fish idle loop, Tailwind v4 tokens, Vitest + React Testing Library. **No new dependencies** — GSAP is deliberately not added (see call 1).

**Spec:** `docs/superpowers/specs/2026-08-11-gymfishes-design.md` — the binding spec. Sections used heavily: §3 (onboarding step 3), §4 (streak rule), §5.1 (fish on the tube, streak chip), §5.5 (Seu peixe / gallery), §6 (catalog, unlocks, art), §7 (celebrations), §8 (motion, tokens), §15 (testing), §16 (structure). Task 13 aligns the spec's wording with the calls below.

## Calls the spec leaves open (settled here, spec updated in Task 13)

Each one is the leaner option; say so if asked.

1. **No GSAP.** The fish's idle tail wag and bob are CSS keyframes (exactly how the wave already drifts), paused by the same `data-waves="paused"` ancestor and disabled under `prefers-reduced-motion`. Celebration choreography uses `motion`, which already ships in the bundle. A second animation library would buy nothing visible at 20 px. The `<Fish>` boundary still lets one fish become a Rive file later.
2. **`<Fish>` has no `level` prop.** The tube already positions the fish with a spring; the component only draws. Interface: `<Fish variant state size />`, `state` ∈ `idle | still | locked`.
3. **Fish palette = existing tokens only.** The six accent colours plus `--ink`, `--ink-2`, `--ink-3`, `--ink-on-water`. A locked fish is a one-colour `--ink-3` silhouette applied by CSS, not a second set of paths.
4. **Unlock conditions are all-time facts** — longest streak ever, best day ever, accumulated volume, completed months won — so a fish never re-locks when a streak breaks.
5. **"Ganhar um mês" counts only months that have ended.** The current month is never counted; a tie counts for nobody (same rule as the wrap-up card).
6. **Celebrations fire for your own new registers only** (inserts from the sheet). Edits and deletes never fire; anything an edit unlocks is celebrated at your next register through `seen_unlocks`.
7. **`seen_unlocks` seeds itself** the first time it is needed with the set already unlocked at that moment, so a fresh device never re-celebrates old fish (spec: you may *miss* one, never repeat one).
8. **"Took the lead" means overtaking a partner who has registered today.** Being the only one with water is not a lead worth a toast every morning.
9. **The unlock screen waits for a button** ("Escolher agora" / "Depois", or a tap outside = Depois). Record and streak screens auto-dismiss after 4 s and on tap.
10. **Several toasts join into one** with " · ". The Toast primitive shows one message; a queue would be machinery.
11. **The round-litre caption replaces the Hoje gap line for 2,5 s** and only when it is the sole celebration (the spec drops an outranked inline). The water surge and the count-up happen regardless.
12. **The streak chip is hidden at 0 days.** At risk = same chip at half opacity.
13. **Onboarding fish picker saves on tap and advances.** No extra "Continuar".
14. **The gallery expands in place in Perfil.** No new screen, route or modal.
15. **The tube total counts up** using the existing `useCountUp`, moved to `src/ui/` so the celebration screen can share it.
16. **"Novo peixe!" shows the real fish**, not the 🐡 emoji the spec used as a stand-in.
17. **Volumes in unlock labels use `formatVolume`** as it is ("1000 L acumulados"); a thousands separator would change a shared formatter for one label.
18. **No exit animation on the celebration screen.** It cuts away on dismiss; only the entrance is animated. `AnimatePresence` would add an unmount delay for nothing the eye needs.

## Global Constraints

Every task's requirements implicitly include all of these:

- UI is pt-BR only. Every user-visible string lives in `src/lib/strings.ts` — no loose strings in JSX. Numbers use decimal comma via `formatVolume`.
- Date math only in `src/lib/dates.ts` and `src/lib/periods.ts`. Timezone fixed `America/Sao_Paulo` (`APP_TZ`). Weeks start Monday. Other modules may *call* those helpers, never re-derive dates.
- Colors only via tokens in `src/styles/tokens.css`. Dark theme only. Flat: no gradients, no glow, no shadows on surfaces. Beyond blue only green (confirm), yellow (streak / first place) and red (delete) exist for UI; fish art additionally uses the six member accents.
- TypeScript `strict` + `noUncheckedIndexedAccess`. No `any`.
- A file passing ~200 lines is doing too much — split it.
- Pure logic gets Vitest unit tests, written test-first (TDD). Components are tested through roles and pt-BR text, never implementation.
- Components never import `supabase` directly — data flows through hooks in `src/features/*`.
- `src/lib/database.types.ts` is generated. Never edit by hand.
- `npm run test:run` and `npm run typecheck` must be green before every commit. Never commit with a failing test.
- Touch targets never below 44px.
- **The cloud database is the only database.** M5 needs no migration (`profiles.fish_variant text not null default 'guppy'` already exists). If one becomes necessary, create a new one, never edit applied ones. NEVER print or overwrite `.env.local`.
- Simplicity wins. When two designs work, ship the leaner one and say so.
- Commands run in Git Bash from the repo root. Run a single test file with `npx vitest run <path>`.
- Tests that newly reach `useMembers` / `useEntries` must mock `@/features/group/queries` and `@/features/entries/queries` — the Supabase client is real under Vitest (it reads `.env.local`) and would otherwise hit the network.

## Pause points (clusters)

Finish a cluster — implementation, review, fixes — then offer a pause before rolling into the next one.

| Cluster | Tasks | What ships |
|---|---|---|
| A — Pure logic | 1–5 | strings, catalog, streaks, unlocks, months won, celebration engine, day state, seen-unlocks storage |
| B — Fish on screen | 6–8 | the `<Fish>` component and 13 art files; fish in the tube, header and standings; the streak chip |
| C — Choosing a fish | 9–10 | gallery in Perfil, picker in onboarding |
| D — Celebrations | 11–12 | full-screen screen, provider, wiring into the register path |
| E — Docs | 13 | spec alignment, roadmap |

## File Map

**New:**
- `src/features/fish/catalog.ts` + `catalog.test.ts` — `FISH_IDS`, `FishId`, `Unlock`, `UNLOCKS`, `STARTERS`, `STREAK_MILESTONES`, `fishOf`, `fishName`, `unlockLabel`
- `src/lib/streaks.ts` + `streaks.test.ts` — `Streak`, `streakOf`, `longestStreak`, `registeredDays`
- `src/features/fish/unlocks.ts` + `unlocks.test.ts` — `UnlockFacts`, `unlockFacts`, `meets`, `unlockedFish`
- `src/features/celebrations/engine.ts` + `engine.test.ts` — `DayState`, `Celebration`, `FullScreenCelebration`, `Presentation`, `celebrationsFor`, `present`, `celebrationText`
- `src/features/celebrations/dayState.ts` + `dayState.test.ts` — `dayStateOf`
- `src/features/celebrations/seenUnlocks.ts` + `seenUnlocks.test.ts` — `SEEN_UNLOCKS_KEY`, `loadSeenUnlocks`, `saveSeenUnlocks`
- `src/features/fish/svg/types.ts`, `svg/index.ts`, and thirteen art files `svg/<id>.ts` — `Tone`, `FishArt`, `ART`
- `src/features/fish/Fish.tsx` + `Fish.test.tsx` — `Fish`, `FishState`
- `src/features/fish/FishGrid.tsx` + `FishGrid.test.tsx` — `FishGrid`
- `src/screens/perfil/FishGallery.tsx` — `FishGallery`
- `src/features/celebrations/CelebrationScreen.tsx` + `CelebrationScreen.test.tsx` — `CelebrationScreen`, `AUTO_DISMISS_MS`
- `src/features/celebrations/CelebrationProvider.tsx` + `CelebrationProvider.test.tsx` — `CelebrationProvider`, `useCelebrations`
- `src/ui/useCountUp.ts` — moved from `src/screens/registrar/useCountUp.ts`, gains a `from` parameter

**Modified:**
- `src/lib/strings.ts` — `hoje.streak`, `onboarding.tituloPeixe`, new `peixes` and `celebracoes` sections
- `src/lib/rankings.ts` + `rankings.test.ts` — `dayTotals`; `totalsByDay` delegates to it
- `src/lib/wrapup.ts` + `wrapup.test.ts` — `Verdict`, `monthVerdict`, `monthsWon`; `monthWrapUp` delegates
- `src/styles/globals.css` — fish keyframes, pause, locked silhouette, reduced-motion
- `src/screens/hoje/MemberTube.tsx`, `ProgressStrip.tsx`, `Hoje.tsx`, `RegistersCard.tsx`, `Hoje.test.tsx`
- `src/screens/ranking/Standings.tsx`
- `src/screens/perfil/Perfil.tsx` + `Perfil.test.tsx`
- `src/features/profile/mutations.ts` — `fish_variant` in the patch type
- `src/screens/onboarding/Onboarding.tsx` + `Onboarding.test.tsx`
- `src/features/entries/mutations.ts` + `mutations.test.tsx` — `insert` returns the optimistic `Entry`
- `src/screens/registrar/submit.ts` + `submit.test.ts` — returns the inserted `Entry | null`
- `src/screens/registrar/RegisterSheet.tsx` + `RegisterSheet.test.tsx` — `useGroupData`, `celebrate`
- `src/app/AppShell.tsx` + `AppShell.test.tsx` — `CelebrationProvider`
- Spec §2, §3, §5.1, §5.5, §6, §7, §8, §9, §16 and `docs/superpowers/plans/ROADMAP.md` (Task 13)

---
### Task 1: M5 strings and the fish catalog

**Files:**
- Modify: `src/lib/strings.ts`
- Create: `src/features/fish/catalog.ts`, `src/features/fish/catalog.test.ts`

**Interfaces:**
- Consumes: `formatVolume` from `src/lib/format.ts`, `STRINGS`.
- Produces:
  - `FISH_IDS: readonly FishId[]` — the thirteen ids in spec §6 table order
  - `type FishId`
  - `type Unlock = { kind: 'starter' } | { kind: 'streak'; days: number } | { kind: 'record'; ml: number } | { kind: 'volume'; ml: number } | { kind: 'wins'; months: number }`
  - `UNLOCKS: Record<FishId, Unlock>`
  - `STARTERS: readonly FishId[]` (`['guppy', 'betta', 'goldfish', 'neon']`)
  - `STREAK_MILESTONES: readonly number[]` (`[7, 30, 100]`, read off the catalog)
  - `fishOf(value: string): FishId` — `'guppy'` for anything unknown
  - `fishName(id: FishId): string`, `unlockLabel(u: Unlock): string`

- [ ] **Step 1: Add the M5 strings**

In `src/lib/strings.ts`, inside `hoje`, after `abrirPerfil: 'Abrir perfil',` add:

```ts
    streak: (dias: number) => `🔥 ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
```

Inside `onboarding`, after `nomeLongo: 'Use no máximo 20 caracteres',` add:

```ts
    tituloPeixe: 'Escolha seu peixe',
```

After the whole `perfil: { ... },` block (before `garrafas`), add two new sections:

```ts
  peixes: {
    seuPeixe: 'Seu peixe',
    trocarPeixe: 'Trocar peixe',
    fechar: 'Fechar',
    galeria: 'Galeria de peixes',
    nomes: {
      guppy: 'Guppy',
      betta: 'Betta',
      goldfish: 'Peixe-dourado',
      neon: 'Neon',
      pufferfish: 'Baiacu',
      clownfish: 'Peixe-palhaço',
      angelfish: 'Peixe-anjo',
      octopus: 'Polvo',
      seahorse: 'Cavalo-marinho',
      turtle: 'Tartaruga',
      dolphin: 'Golfinho',
      shark: 'Tubarão',
      whale: 'Baleia',
    },
    inicial: 'Inicial',
    sequenciaDias: (dias: number) => `Sequência de ${dias} dias`,
    umDiaAcimaDe: (volume: string) => `Um dia acima de ${volume}`,
    acumulados: (volume: string) => `${volume} acumulados`,
    ganharMeses: (meses: number) => (meses === 1 ? 'Ganhar 1 mês' : `Ganhar ${meses} meses`),
  },
  celebracoes: {
    novoPeixe: 'Novo peixe!',
    escolherAgora: 'Escolher agora',
    depois: 'Depois',
    novoRecorde: (volume: string) => `Novo recorde! ${volume}`,
    diasSeguidos: (dias: number) => `🔥 ${dias} dias seguidos!`,
    lideranca: 'Você assumiu a liderança 🏆',
    litrosHoje: (litros: number) => `${litros} L hoje`,
    separador: ' · ',
  },
```

- [ ] **Step 2: Write the failing catalog test**

Create `src/features/fish/catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FISH_IDS, STARTERS, STREAK_MILESTONES, UNLOCKS, fishName, fishOf, unlockLabel } from './catalog'

describe('catalog', () => {
  it('has thirteen fish, four of them starters', () => {
    expect(FISH_IDS).toHaveLength(13)
    expect(STARTERS).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
  })

  it('reads the streak milestones off the catalog', () => {
    expect(STREAK_MILESTONES).toEqual([7, 30, 100])
  })

  it('falls back to guppy for an unknown variant', () => {
    expect(fishOf('betta')).toBe('betta')
    expect(fishOf('')).toBe('guppy')
    expect(fishOf('dragon')).toBe('guppy')
  })

  it('names fish in pt-BR', () => {
    expect(fishName('goldfish')).toBe('Peixe-dourado')
    expect(fishName('clownfish')).toBe('Peixe-palhaço')
  })

  it('describes every unlock condition in pt-BR', () => {
    expect(unlockLabel(UNLOCKS.guppy)).toBe('Inicial')
    expect(unlockLabel(UNLOCKS.pufferfish)).toBe('Sequência de 7 dias')
    expect(unlockLabel(UNLOCKS.octopus)).toBe('Um dia acima de 5 L')
    expect(unlockLabel(UNLOCKS.seahorse)).toBe('100 L acumulados')
    expect(unlockLabel(UNLOCKS.dolphin)).toBe('1000 L acumulados')
    expect(unlockLabel(UNLOCKS.shark)).toBe('Ganhar 1 mês')
    expect(unlockLabel(UNLOCKS.whale)).toBe('Ganhar 3 meses')
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/features/fish/catalog.test.ts`
Expected: FAIL — cannot find module `./catalog`.

- [ ] **Step 4: Implement `src/features/fish/catalog.ts`**

```ts
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/** Spec §6 table order — also the priority among fish unlocked by the same register. */
export const FISH_IDS = [
  'guppy',
  'betta',
  'goldfish',
  'neon',
  'pufferfish',
  'clownfish',
  'angelfish',
  'octopus',
  'seahorse',
  'turtle',
  'dolphin',
  'shark',
  'whale',
] as const

export type FishId = (typeof FISH_IDS)[number]

export type Unlock =
  | { kind: 'starter' }
  | { kind: 'streak'; days: number }
  | { kind: 'record'; ml: number }
  | { kind: 'volume'; ml: number }
  | { kind: 'wins'; months: number }

export const UNLOCKS: Record<FishId, Unlock> = {
  guppy: { kind: 'starter' },
  betta: { kind: 'starter' },
  goldfish: { kind: 'starter' },
  neon: { kind: 'starter' },
  pufferfish: { kind: 'streak', days: 7 },
  clownfish: { kind: 'streak', days: 30 },
  angelfish: { kind: 'streak', days: 100 },
  octopus: { kind: 'record', ml: 5000 },
  seahorse: { kind: 'volume', ml: 100_000 },
  turtle: { kind: 'volume', ml: 500_000 },
  dolphin: { kind: 'volume', ml: 1_000_000 },
  shark: { kind: 'wins', months: 1 },
  whale: { kind: 'wins', months: 3 },
}

export const STARTERS: readonly FishId[] = FISH_IDS.filter((id) => UNLOCKS[id].kind === 'starter')

/** 7, 30, 100 — read off the catalog so the streak celebration and the streak fish can never disagree. */
export const STREAK_MILESTONES: readonly number[] = FISH_IDS.flatMap((id) => {
  const u = UNLOCKS[id]
  return u.kind === 'streak' ? [u.days] : []
})

/** `profiles.fish_variant` is free text in the DB; anything we don't draw becomes the default guppy. */
export function fishOf(value: string): FishId {
  return (FISH_IDS as readonly string[]).includes(value) ? (value as FishId) : 'guppy'
}

export function fishName(id: FishId): string {
  return STRINGS.peixes.nomes[id]
}

/** The condition text under a locked fish in the gallery (spec §5.5). */
export function unlockLabel(u: Unlock): string {
  switch (u.kind) {
    case 'starter':
      return STRINGS.peixes.inicial
    case 'streak':
      return STRINGS.peixes.sequenciaDias(u.days)
    case 'record':
      return STRINGS.peixes.umDiaAcimaDe(formatVolume(u.ml))
    case 'volume':
      return STRINGS.peixes.acumulados(formatVolume(u.ml))
    case 'wins':
      return STRINGS.peixes.ganharMeses(u.months)
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/features/fish/catalog.test.ts`
Expected: PASS

- [ ] **Step 6: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/strings.ts src/features/fish/catalog.ts src/features/fish/catalog.test.ts
git commit -m "feat: M5 strings and the fish catalog"
```

---

### Task 2: Streaks, and per-day totals across all time

**Files:**
- Modify: `src/lib/rankings.ts`, `src/lib/rankings.test.ts`
- Create: `src/lib/streaks.ts`, `src/lib/streaks.test.ts`

**Interfaces:**
- Consumes: `addDays`, `DayKey` from `dates.ts`; `RankableEntry`, `containsDay`.
- Produces:
  - `dayTotals(entries: readonly RankableEntry[], profileId: string): Map<DayKey, number>` — one member's ml per day, all time, live rows only
  - `type Streak = { days: number; atRisk: boolean }`
  - `streakOf(days: ReadonlySet<DayKey>, today: DayKey): Streak`
  - `longestStreak(days: ReadonlySet<DayKey>): number`
  - `registeredDays(entries: readonly RankableEntry[], profileId: string): Set<DayKey>`

- [ ] **Step 1: Write the failing rankings test**

Append to `src/lib/rankings.test.ts` (add `dayTotals` to the import from `./rankings`):

```ts
describe('dayTotals', () => {
  it('sums one member per day across all time, ignoring deleted rows and other members', () => {
    const totals = dayTotals(
      [
        e('a', 500, '2026-09-01'),
        e('a', 300, '2026-09-01'),
        e('a', 900, '2026-07-15'),
        e('a', 999, '2026-07-15', '2026-07-15T13:00:00Z'),
        e('b', 250, '2026-09-01'),
      ],
      'a',
    )
    expect([...totals.entries()]).toEqual([
      ['2026-09-01', 800],
      ['2026-07-15', 900],
    ])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rankings.test.ts`
Expected: FAIL — `dayTotals` is not exported.

- [ ] **Step 3: Implement `dayTotals` and make `totalsByDay` delegate**

In `src/lib/rankings.ts`, replace the whole `totalsByDay` function with:

```ts
/** One member's volume per day across every live register — the all-time input for streaks and unlocks. */
export function dayTotals(entries: readonly RankableEntry[], profileId: string): Map<DayKey, number> {
  const totals = new Map<DayKey, number>()
  for (const e of entries) {
    if (e.deleted_at || e.profile_id !== profileId) continue
    totals.set(e.drank_on, (totals.get(e.drank_on) ?? 0) + e.total_ml)
  }
  return totals
}

/** One member's volume per day inside the period; days without registers are absent. */
export function totalsByDay(
  entries: readonly RankableEntry[],
  p: Period,
  profileId: string,
): Map<DayKey, number> {
  const totals = new Map<DayKey, number>()
  for (const [day, ml] of dayTotals(entries, profileId)) {
    if (containsDay(p, day)) totals.set(day, ml)
  }
  return totals
}
```

- [ ] **Step 4: Run the rankings tests**

Run: `npx vitest run src/lib/rankings.test.ts`
Expected: PASS (the existing `totalsByDay` tests still pass — same results, different plumbing).

- [ ] **Step 5: Write the failing streaks test**

Create `src/lib/streaks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { longestStreak, registeredDays, streakOf } from './streaks'

const days = (...k: string[]) => new Set(k)

describe('streakOf', () => {
  it('counts today and the consecutive days before it', () => {
    expect(streakOf(days('2026-08-08', '2026-08-09', '2026-08-10'), '2026-08-10')).toEqual({ days: 3, atRisk: false })
  })

  it('shows yesterday value, at risk, while today is not logged', () => {
    expect(streakOf(days('2026-08-08', '2026-08-09'), '2026-08-10')).toEqual({ days: 2, atRisk: true })
  })

  it('breaks only once yesterday is also empty', () => {
    expect(streakOf(days('2026-08-07', '2026-08-08'), '2026-08-10')).toEqual({ days: 0, atRisk: false })
  })

  it('stops at a gap', () => {
    expect(streakOf(days('2026-08-05', '2026-08-06', '2026-08-08', '2026-08-09', '2026-08-10'), '2026-08-10').days).toBe(3)
  })

  it('crosses month and year boundaries', () => {
    expect(streakOf(days('2026-07-31', '2026-08-01'), '2026-08-01').days).toBe(2)
    expect(streakOf(days('2025-12-31', '2026-01-01'), '2026-01-01').days).toBe(2)
  })

  it('is 0 with no registers at all', () => {
    expect(streakOf(days(), '2026-08-10')).toEqual({ days: 0, atRisk: false })
  })
})

describe('longestStreak', () => {
  it('is 0 with no days', () => {
    expect(longestStreak(days())).toBe(0)
  })

  it('finds the longest run anywhere in history', () => {
    const history = days(
      '2026-06-01', '2026-06-02', '2026-06-03',
      '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14',
      '2026-06-20',
    )
    expect(longestStreak(history)).toBe(5)
  })
})

describe('registeredDays', () => {
  it('collects the days one member has live registers on', () => {
    const e = (profile_id: string, drank_on: string, deleted_at: string | null = null) => ({ profile_id, total_ml: 500, drank_on, deleted_at })
    expect(
      registeredDays([e('a', '2026-08-01'), e('a', '2026-08-01'), e('a', '2026-08-03'), e('a', '2026-08-04', 'x'), e('b', '2026-08-05')], 'a'),
    ).toEqual(days('2026-08-01', '2026-08-03'))
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/lib/streaks.test.ts`
Expected: FAIL — cannot find module `./streaks`.

- [ ] **Step 7: Implement `src/lib/streaks.ts`**

```ts
import { addDays, type DayKey } from './dates'
import { dayTotals, type RankableEntry } from './rankings'

export type Streak = {
  days: number
  /** Today has no register yet: `days` is yesterday's value and the chip dims (spec §4). */
  atRisk: boolean
}

/** Consecutive registered days counting back from today — or from yesterday while today is empty. */
export function streakOf(days: ReadonlySet<DayKey>, today: DayKey): Streak {
  const atRisk = !days.has(today)
  let cursor = atRisk ? addDays(today, -1) : today
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return { days: n, atRisk: atRisk && n > 0 }
}

/** The longest run ever — what the streak fish are judged on, so a broken streak never re-locks one. */
export function longestStreak(days: ReadonlySet<DayKey>): number {
  let best = 0
  for (const start of days) {
    if (days.has(addDays(start, -1))) continue // not the first day of a run
    let n = 0
    for (let cursor = start; days.has(cursor); cursor = addDays(cursor, 1)) n++
    if (n > best) best = n
  }
  return best
}

/** Days on which `profileId` has at least one live register. */
export function registeredDays(entries: readonly RankableEntry[], profileId: string): Set<DayKey> {
  return new Set(dayTotals(entries, profileId).keys())
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/lib/streaks.test.ts`
Expected: PASS

- [ ] **Step 9: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/lib/rankings.ts src/lib/rankings.test.ts src/lib/streaks.ts src/lib/streaks.test.ts
git commit -m "feat: streaks and all-time day totals"
```

---

### Task 3: Months won and the derived unlock set

**Files:**
- Modify: `src/lib/wrapup.ts`, `src/lib/wrapup.test.ts`
- Create: `src/features/fish/unlocks.ts`, `src/features/fish/unlocks.test.ts`

**Interfaces:**
- Consumes: `standings`, `totalsForPeriod`, `firstRegisterDay`, `dayTotals` (rankings); `monthPeriod`, `stepPeriod` (periods); `longestStreak` (streaks); `FISH_IDS`, `UNLOCKS`, `Unlock`, `FishId` (catalog).
- Produces:
  - `type Verdict = { rows: Standing[]; winnerId: string | null }`
  - `monthVerdict(entries, memberIds, period: Period): Verdict | null` — null when nobody registered that month
  - `monthsWon(entries, memberIds, profileId, today: DayKey): number` — completed months won outright
  - `type UnlockFacts = { longestStreak: number; bestDayMl: number; totalMl: number; monthsWon: number }`
  - `unlockFacts(entries, profileId, monthsWon): UnlockFacts`
  - `meets(u: Unlock, f: UnlockFacts): boolean`
  - `unlockedFish(entries, profileId, monthsWon): Set<FishId>`

- [ ] **Step 1: Write the failing wrap-up tests**

Append to `src/lib/wrapup.test.ts` (extend the import to `import { monthVerdict, monthWrapUp, monthsWon, wrapUpStorageKey } from './wrapup'`):

```ts
describe('monthVerdict', () => {
  it('is null for a month nobody registered in', () => {
    expect(monthVerdict([e('a', 500, '2026-08-01')], ['a', 'b'], monthPeriod('2026-07-01'))).toBeNull()
  })

  it('names the outright leader, nobody on a tie', () => {
    const july = monthPeriod('2026-07-01')
    expect(monthVerdict([e('a', 500, '2026-07-01'), e('b', 200, '2026-07-02')], ['a', 'b'], july)?.winnerId).toBe('a')
    expect(monthVerdict([e('a', 500, '2026-07-01'), e('b', 500, '2026-07-02')], ['a', 'b'], july)?.winnerId).toBeNull()
  })
})

describe('monthsWon', () => {
  const entries = [
    e('a', 5000, '2026-06-10'), e('b', 4000, '2026-06-11'), // June: a
    e('a', 1000, '2026-07-10'), e('b', 4000, '2026-07-11'), // July: b
    e('a', 3000, '2026-08-10'), e('b', 3000, '2026-08-11'), // August: tie
    e('a', 9000, '2026-09-01'), // September, still running: a leads but it does not count yet
  ]

  it('counts only completed months won outright', () => {
    expect(monthsWon(entries, ['a', 'b'], 'a', '2026-09-08')).toBe(1)
    expect(monthsWon(entries, ['a', 'b'], 'b', '2026-09-08')).toBe(1)
  })

  it('counts the running month once it has ended', () => {
    expect(monthsWon(entries, ['a', 'b'], 'a', '2026-10-01')).toBe(2)
  })

  it('skips silent months and is 0 with no registers', () => {
    expect(monthsWon([e('a', 500, '2026-05-01')], ['a', 'b'], 'a', '2026-09-08')).toBe(1)
    expect(monthsWon([], ['a', 'b'], 'a', '2026-09-08')).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/wrapup.test.ts`
Expected: FAIL — `monthVerdict` / `monthsWon` are not exported.

- [ ] **Step 3: Rewrite `src/lib/wrapup.ts`**

```ts
import type { DayKey } from './dates'
import { monthPeriod, stepPeriod, type Period } from './periods'
import { firstRegisterDay, standings, totalsForPeriod, type RankableEntry, type Standing } from './rankings'

export type Verdict = { rows: Standing[]; winnerId: string | null }

export type WrapUp = { period: Period } & Verdict

/** One month's standings and its winner; null when nobody registered. A tie has no winner. */
export function monthVerdict(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  period: Period,
): Verdict | null {
  const rows = standings(totalsForPeriod(entries, period), memberIds)
  const [first, second] = rows
  if (!first || first.ml === 0) return null
  return { rows, winnerId: second && second.ml === first.ml ? null : first.profileId }
}

/** Last month's result, or null when nobody registered in it (spec §5.3). */
export function monthWrapUp(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  today: DayKey,
): WrapUp | null {
  const period = stepPeriod(monthPeriod(today), -1)
  const verdict = monthVerdict(entries, memberIds, period)
  return verdict ? { period, ...verdict } : null
}

/** Completed months (before today's) that `profileId` won outright — the Tubarão/Baleia counter (spec §6). */
export function monthsWon(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  profileId: string,
  today: DayKey,
): number {
  const first = firstRegisterDay(entries)
  if (!first) return 0
  const current = monthPeriod(today)
  let n = 0
  for (let p = monthPeriod(first); p.start < current.start; p = stepPeriod(p, 1)) {
    if (monthVerdict(entries, memberIds, p)?.winnerId === profileId) n++
  }
  return n
}

/** One key per month, per device — deliberately unsynced (spec §5.3). */
export function wrapUpStorageKey(period: Period): string {
  return `gymfishes:wrapup:${period.start.slice(0, 7)}`
}
```

- [ ] **Step 4: Run the wrap-up tests**

Run: `npx vitest run src/lib/wrapup.test.ts`
Expected: PASS (the existing `monthWrapUp` tests included).

- [ ] **Step 5: Write the failing unlocks test**

Create `src/features/fish/unlocks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { unlockFacts, unlockedFish } from './unlocks'

const e = (profile_id: string, total_ml: number, drank_on: string, deleted_at: string | null = null) => ({
  profile_id,
  total_ml,
  drank_on,
  deleted_at,
})

/** `n` consecutive 500 ml days for member `a`, starting at `from`. */
const run = (n: number, from = '2026-06-01') => Array.from({ length: n }, (_, i) => e('a', 500, addDays(from, i)))

describe('unlockedFish', () => {
  it('always includes the four starters, even with no registers', () => {
    expect([...unlockedFish([], 'a', 0)]).toEqual(['guppy', 'betta', 'goldfish', 'neon'])
  })

  it('unlocks the streak fish at exactly 7, 30 and 100 consecutive days', () => {
    expect(unlockedFish(run(6), 'a', 0).has('pufferfish')).toBe(false)
    expect(unlockedFish(run(7), 'a', 0).has('pufferfish')).toBe(true)
    expect(unlockedFish(run(29), 'a', 0).has('clownfish')).toBe(false)
    expect(unlockedFish(run(30), 'a', 0).has('clownfish')).toBe(true)
    expect(unlockedFish(run(99), 'a', 0).has('angelfish')).toBe(false)
    expect(unlockedFish(run(100), 'a', 0).has('angelfish')).toBe(true)
  })

  it('keeps a streak fish after the streak breaks — the longest run ever counts', () => {
    expect(unlockedFish([...run(7), e('a', 500, '2026-06-20')], 'a', 0).has('pufferfish')).toBe(true)
  })

  it('needs one day strictly above 5 L for the octopus', () => {
    expect(unlockedFish([e('a', 2500, '2026-06-01'), e('a', 2500, '2026-06-01')], 'a', 0).has('octopus')).toBe(false)
    expect(unlockedFish([e('a', 2500, '2026-06-01'), e('a', 2501, '2026-06-01')], 'a', 0).has('octopus')).toBe(true)
  })

  it('unlocks by accumulated volume at 100, 500 and 1000 L', () => {
    const litres = (l: number) => Array.from({ length: l }, (_, i) => e('a', 1000, addDays('2020-01-01', i)))
    expect(unlockedFish(litres(99), 'a', 0).has('seahorse')).toBe(false)
    expect(unlockedFish(litres(100), 'a', 0).has('seahorse')).toBe(true)
    expect(unlockedFish(litres(499), 'a', 0).has('turtle')).toBe(false)
    expect(unlockedFish(litres(500), 'a', 0).has('turtle')).toBe(true)
    expect(unlockedFish(litres(999), 'a', 0).has('dolphin')).toBe(false)
    expect(unlockedFish(litres(1000), 'a', 0).has('dolphin')).toBe(true)
  })

  it('unlocks the shark after one month won and the whale after three', () => {
    expect(unlockedFish([], 'a', 0).has('shark')).toBe(false)
    expect(unlockedFish([], 'a', 1).has('shark')).toBe(true)
    expect(unlockedFish([], 'a', 2).has('whale')).toBe(false)
    expect(unlockedFish([], 'a', 3).has('whale')).toBe(true)
  })

  it('ignores deleted rows and other members', () => {
    const noise = [
      ...run(7).map((r) => ({ ...r, deleted_at: '2026-06-09T00:00:00Z' })),
      ...run(7).map((r) => ({ ...r, profile_id: 'b' })),
    ]
    expect(unlockedFish(noise, 'a', 0).has('pufferfish')).toBe(false)
  })
})

describe('unlockFacts', () => {
  it('reports the all-time facts the conditions look at', () => {
    const facts = unlockFacts([...run(3), e('a', 4000, '2026-06-02'), e('a', 100, '2026-05-01')], 'a', 2)
    expect(facts).toEqual({ longestStreak: 3, bestDayMl: 4500, totalMl: 5600, monthsWon: 2 })
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/features/fish/unlocks.test.ts`
Expected: FAIL — cannot find module `./unlocks`.

- [ ] **Step 7: Implement `src/features/fish/unlocks.ts`**

```ts
import { dayTotals, type RankableEntry } from '@/lib/rankings'
import { longestStreak } from '@/lib/streaks'
import { FISH_IDS, UNLOCKS, type FishId, type Unlock } from './catalog'

export type UnlockFacts = {
  longestStreak: number
  bestDayMl: number
  totalMl: number
  monthsWon: number
}

/** Everything the thirteen conditions look at, from one member's registers. All-time on purpose. */
export function unlockFacts(entries: readonly RankableEntry[], profileId: string, monthsWon: number): UnlockFacts {
  const byDay = dayTotals(entries, profileId)
  let totalMl = 0
  let bestDayMl = 0
  for (const ml of byDay.values()) {
    totalMl += ml
    if (ml > bestDayMl) bestDayMl = ml
  }
  return { longestStreak: longestStreak(new Set(byDay.keys())), bestDayMl, totalMl, monthsWon }
}

export function meets(u: Unlock, f: UnlockFacts): boolean {
  switch (u.kind) {
    case 'starter':
      return true
    case 'streak':
      return f.longestStreak >= u.days
    case 'record':
      return f.bestDayMl > u.ml
    case 'volume':
      return f.totalMl >= u.ml
    case 'wins':
      return f.monthsWon >= u.months
  }
}

/**
 * Derived, never stored (spec §6). Every fact is all-time, so the set only ever grows — a
 * broken streak keeps its fish. `monthsWon` comes from `lib/wrapup.ts`.
 */
export function unlockedFish(entries: readonly RankableEntry[], profileId: string, monthsWon: number): Set<FishId> {
  const facts = unlockFacts(entries, profileId, monthsWon)
  return new Set(FISH_IDS.filter((id) => meets(UNLOCKS[id], facts)))
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/features/fish/unlocks.test.ts`
Expected: PASS

- [ ] **Step 9: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/lib/wrapup.ts src/lib/wrapup.test.ts src/features/fish/unlocks.ts src/features/fish/unlocks.test.ts
git commit -m "feat: months won and the derived unlock set"
```

---
### Task 4: Celebration engine

**Files:**
- Create: `src/features/celebrations/engine.ts`, `src/features/celebrations/engine.test.ts`

**Interfaces:**
- Consumes: `FISH_IDS`, `STREAK_MILESTONES`, `fishName`, `FishId` (catalog); `formatVolume`; `STRINGS`.
- Produces:
  - `type DayState = { todayMl: number; bestOtherDayMl: number; leading: boolean; streakDays: number; unlocked: ReadonlySet<FishId> }`
  - `type Celebration = { kind: 'unlock'; fish: FishId } | { kind: 'record'; ml: number } | { kind: 'streak'; days: number } | { kind: 'lead' } | { kind: 'litre'; litres: number }`
  - `type FullScreenCelebration = Extract<Celebration, { kind: 'unlock' | 'record' | 'streak' }>`
  - `type Presentation = { fullScreen: FullScreenCelebration | null; toasts: Celebration[]; inline: Celebration | null }`
  - `celebrationsFor(before: DayState, after: DayState): Celebration[]` — spec §7 priority order
  - `present(cels: readonly Celebration[]): Presentation`
  - `celebrationText(c: Celebration): string`

- [ ] **Step 1: Write the failing test**

Create `src/features/celebrations/engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { FishId } from '@/features/fish/catalog'
import { celebrationText, celebrationsFor, present, type Celebration, type DayState } from './engine'

const STARTERS: FishId[] = ['guppy', 'betta', 'goldfish', 'neon']

function state(over: Partial<DayState> = {}): DayState {
  return { todayMl: 0, bestOtherDayMl: 0, leading: false, streakDays: 0, unlocked: new Set(STARTERS), ...over }
}

describe('celebrationsFor', () => {
  it('is empty when nothing worth celebrating changed', () => {
    expect(celebrationsFor(state({ todayMl: 500 }), state({ todayMl: 800 }))).toEqual([])
  })

  it('celebrates each newly unlocked fish, in catalog order', () => {
    const after = state({ unlocked: new Set<FishId>([...STARTERS, 'shark', 'pufferfish']) })
    expect(celebrationsFor(state(), after)).toEqual([
      { kind: 'unlock', fish: 'pufferfish' },
      { kind: 'unlock', fish: 'shark' },
    ])
  })

  it('needs a previous best to beat — day one is not a record', () => {
    expect(celebrationsFor(state({ todayMl: 1000 }), state({ todayMl: 4200 }))).toEqual([])
  })

  it('fires the record once, when today first passes the old best', () => {
    const before = state({ todayMl: 3900, bestOtherDayMl: 4000 })
    expect(celebrationsFor(before, state({ todayMl: 4000, bestOtherDayMl: 4000 }))).toEqual([])
    expect(celebrationsFor(before, state({ todayMl: 4200, bestOtherDayMl: 4000 }))).toEqual([{ kind: 'record', ml: 4200 }])
    expect(
      celebrationsFor(state({ todayMl: 4200, bestOtherDayMl: 4000 }), state({ todayMl: 4500, bestOtherDayMl: 4000 })),
    ).toEqual([])
  })

  it('fires the highest streak milestone crossed', () => {
    expect(celebrationsFor(state({ streakDays: 6 }), state({ streakDays: 7 }))).toEqual([{ kind: 'streak', days: 7 }])
    expect(celebrationsFor(state({ streakDays: 7 }), state({ streakDays: 7 }))).toEqual([])
    expect(celebrationsFor(state({ streakDays: 5 }), state({ streakDays: 31 }))).toEqual([{ kind: 'streak', days: 30 }])
  })

  it('fires the lead only on the transition', () => {
    expect(celebrationsFor(state({ leading: false }), state({ leading: true }))).toEqual([{ kind: 'lead' }])
    expect(celebrationsFor(state({ leading: true }), state({ leading: true }))).toEqual([])
  })

  it('fires a round litre when the whole-litre count grows', () => {
    expect(celebrationsFor(state({ todayMl: 1800 }), state({ todayMl: 2300 }))).toEqual([{ kind: 'litre', litres: 2 }])
    expect(celebrationsFor(state({ todayMl: 2100 }), state({ todayMl: 2900 }))).toEqual([])
  })

  it('orders everything by spec priority: unlock > record > streak > lead > litre', () => {
    const before = state({ todayMl: 900, bestOtherDayMl: 1500, streakDays: 6 })
    const after = state({
      todayMl: 2000,
      bestOtherDayMl: 1500,
      streakDays: 7,
      leading: true,
      unlocked: new Set<FishId>([...STARTERS, 'pufferfish']),
    })
    expect(celebrationsFor(before, after).map((c) => c.kind)).toEqual(['unlock', 'record', 'streak', 'lead', 'litre'])
  })
})

describe('present', () => {
  it('shows at most one full screen and demotes the other big ones to toasts', () => {
    const cels: Celebration[] = [
      { kind: 'unlock', fish: 'pufferfish' },
      { kind: 'record', ml: 4200 },
      { kind: 'streak', days: 7 },
      { kind: 'lead' },
      { kind: 'litre', litres: 2 },
    ]
    const p = present(cels)
    expect(p.fullScreen).toEqual({ kind: 'unlock', fish: 'pufferfish' })
    expect(p.toasts).toEqual([{ kind: 'record', ml: 4200 }, { kind: 'streak', days: 7 }, { kind: 'lead' }])
    expect(p.inline).toBeNull()
  })

  it('shows the litre inline only when it is alone', () => {
    expect(present([{ kind: 'litre', litres: 2 }]).inline).toEqual({ kind: 'litre', litres: 2 })
    expect(present([{ kind: 'lead' }, { kind: 'litre', litres: 2 }])).toEqual({
      fullScreen: null,
      toasts: [{ kind: 'lead' }],
      inline: null,
    })
  })

  it('is all empty for no celebrations', () => {
    expect(present([])).toEqual({ fullScreen: null, toasts: [], inline: null })
  })
})

describe('celebrationText', () => {
  it('reads in pt-BR', () => {
    expect(celebrationText({ kind: 'unlock', fish: 'pufferfish' })).toBe('Novo peixe! Baiacu')
    expect(celebrationText({ kind: 'record', ml: 4200 })).toBe('Novo recorde! 4,2 L')
    expect(celebrationText({ kind: 'streak', days: 30 })).toBe('🔥 30 dias seguidos!')
    expect(celebrationText({ kind: 'lead' })).toBe('Você assumiu a liderança 🏆')
    expect(celebrationText({ kind: 'litre', litres: 2 })).toBe('2 L hoje')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/celebrations/engine.test.ts`
Expected: FAIL — cannot find module `./engine`.

- [ ] **Step 3: Implement `src/features/celebrations/engine.ts`**

```ts
import { FISH_IDS, STREAK_MILESTONES, fishName, type FishId } from '@/features/fish/catalog'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'

/** "Your day" as the engine sees it. Built by `dayState.ts` before and after a register. */
export type DayState = {
  todayMl: number
  /** Your best day before today, 0 when there is none — the bar a record has to clear. */
  bestOtherDayMl: number
  /** Ahead of a partner who has registered today (spec §7 "took the lead"). */
  leading: boolean
  streakDays: number
  unlocked: ReadonlySet<FishId>
}

export type Celebration =
  | { kind: 'unlock'; fish: FishId }
  | { kind: 'record'; ml: number }
  | { kind: 'streak'; days: number }
  | { kind: 'lead' }
  | { kind: 'litre'; litres: number }

export type FullScreenCelebration = Extract<Celebration, { kind: 'unlock' | 'record' | 'streak' }>

function isFullScreen(c: Celebration): c is FullScreenCelebration {
  return c.kind === 'unlock' || c.kind === 'record' || c.kind === 'streak'
}

/** Everything one register earned, in spec §7 priority order: unlock > record > streak > lead > litre. */
export function celebrationsFor(before: DayState, after: DayState): Celebration[] {
  const out: Celebration[] = []
  for (const fish of FISH_IDS) {
    if (after.unlocked.has(fish) && !before.unlocked.has(fish)) out.push({ kind: 'unlock', fish })
  }
  const bar = after.bestOtherDayMl
  if (bar > 0 && before.todayMl <= bar && after.todayMl > bar) out.push({ kind: 'record', ml: after.todayMl })
  const days = STREAK_MILESTONES.findLast((m) => before.streakDays < m && after.streakDays >= m)
  if (days !== undefined) out.push({ kind: 'streak', days })
  if (!before.leading && after.leading) out.push({ kind: 'lead' })
  const litres = Math.floor(after.todayMl / 1000)
  if (litres > Math.floor(before.todayMl / 1000)) out.push({ kind: 'litre', litres })
  return out
}

export type Presentation = {
  fullScreen: FullScreenCelebration | null
  toasts: Celebration[]
  inline: Celebration | null
}

/**
 * Spec §7 rules: one full screen at most; outranked full-screen kinds degrade to toasts; the
 * lead is a toast by nature; the round litre is inline and is dropped when anything outranks it.
 */
export function present(cels: readonly Celebration[]): Presentation {
  const [fullScreen = null, ...demoted] = cels.filter(isFullScreen)
  const toasts: Celebration[] = [...demoted, ...cels.filter((c) => c.kind === 'lead')]
  const only = cels.length === 1 ? cels[0] : undefined
  return { fullScreen, toasts, inline: only?.kind === 'litre' ? only : null }
}

export function celebrationText(c: Celebration): string {
  switch (c.kind) {
    case 'unlock':
      return `${STRINGS.celebracoes.novoPeixe} ${fishName(c.fish)}`
    case 'record':
      return STRINGS.celebracoes.novoRecorde(formatVolume(c.ml))
    case 'streak':
      return STRINGS.celebracoes.diasSeguidos(c.days)
    case 'lead':
      return STRINGS.celebracoes.lideranca
    case 'litre':
      return STRINGS.celebracoes.litrosHoje(c.litres)
  }
}
```

`Array.prototype.findLast` is available: `tsconfig.app.json` targets `ES2023`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/celebrations/engine.test.ts`
Expected: PASS

- [ ] **Step 5: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/celebrations/engine.ts src/features/celebrations/engine.test.ts
git commit -m "feat: celebration engine with spec priority and presentation"
```

---

### Task 5: Day state and seen-unlocks storage

**Files:**
- Create: `src/features/celebrations/dayState.ts`, `dayState.test.ts`, `seenUnlocks.ts`, `seenUnlocks.test.ts`

**Interfaces:**
- Consumes: `totalsForDay`, `dayTotals`, `RankableEntry` (rankings); `streakOf` (streaks); `monthsWon` (wrapup); `unlockedFish` (unlocks); `DayState` (engine); `FISH_IDS`, `FishId` (catalog).
- Produces:
  - `dayStateOf(entries: readonly RankableEntry[], memberIds: readonly string[], userId: string, today: DayKey): DayState`
  - `SEEN_UNLOCKS_KEY = 'gymfishes:seen_unlocks'`
  - `loadSeenUnlocks(): Set<FishId> | null` — null when this device never recorded any
  - `saveSeenUnlocks(seen: ReadonlySet<FishId>): void`

- [ ] **Step 1: Write the failing day-state test**

Create `src/features/celebrations/dayState.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { dayStateOf } from './dayState'

const today = '2026-09-08'
const ids = ['a', 'b']
const e = (profile_id: string, total_ml: number, drank_on: string) => ({ profile_id, total_ml, drank_on, deleted_at: null })

describe('dayStateOf', () => {
  it('starts empty with the starters unlocked', () => {
    expect(dayStateOf([], ids, 'a', today)).toEqual({
      todayMl: 0,
      bestOtherDayMl: 0,
      leading: false,
      streakDays: 0,
      unlocked: new Set(['guppy', 'betta', 'goldfish', 'neon']),
    })
  })

  it('sums today and takes the best day from other days only', () => {
    const s = dayStateOf(
      [e('a', 1000, today), e('a', 800, today), e('a', 4000, addDays(today, -3)), e('a', 3000, addDays(today, -1))],
      ids,
      'a',
      today,
    )
    expect(s.todayMl).toBe(1800)
    expect(s.bestOtherDayMl).toBe(4000)
  })

  it('leads only when ahead of a partner who registered today', () => {
    expect(dayStateOf([e('a', 500, today)], ids, 'a', today).leading).toBe(false)
    expect(dayStateOf([e('a', 500, today), e('b', 300, today)], ids, 'a', today).leading).toBe(true)
    expect(dayStateOf([e('a', 300, today), e('b', 300, today)], ids, 'a', today).leading).toBe(false)
    expect(dayStateOf([e('a', 500, today), e('b', 300, addDays(today, -1))], ids, 'a', today).leading).toBe(false)
  })

  it('reports the streak as of today, or as of yesterday while today is empty', () => {
    const run = [e('a', 500, addDays(today, -2)), e('a', 500, addDays(today, -1))]
    expect(dayStateOf(run, ids, 'a', today).streakDays).toBe(2)
    expect(dayStateOf([...run, e('a', 500, today)], ids, 'a', today).streakDays).toBe(3)
  })

  it('derives the unlocked set from the same entries', () => {
    const week = Array.from({ length: 7 }, (_, i) => e('a', 500, addDays(today, -i)))
    expect(dayStateOf(week, ids, 'a', today).unlocked.has('pufferfish')).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/celebrations/dayState.test.ts`
Expected: FAIL — cannot find module `./dayState`.

- [ ] **Step 3: Implement `src/features/celebrations/dayState.ts`**

```ts
import { unlockedFish } from '@/features/fish/unlocks'
import type { DayKey } from '@/lib/dates'
import { dayTotals, totalsForDay, type RankableEntry } from '@/lib/rankings'
import { streakOf } from '@/lib/streaks'
import { monthsWon } from '@/lib/wrapup'
import type { DayState } from './engine'

/** Snapshot of "your day" from the mirror — computed before and after a register (spec §7). */
export function dayStateOf(
  entries: readonly RankableEntry[],
  memberIds: readonly string[],
  userId: string,
  today: DayKey,
): DayState {
  const todays = totalsForDay(entries, today)
  const mine = todays.get(userId) ?? 0
  const partnerBest = Math.max(0, ...memberIds.filter((id) => id !== userId).map((id) => todays.get(id) ?? 0))
  const byDay = dayTotals(entries, userId)
  let bestOtherDayMl = 0
  for (const [day, ml] of byDay) {
    if (day !== today && ml > bestOtherDayMl) bestOtherDayMl = ml
  }
  return {
    todayMl: mine,
    bestOtherDayMl,
    leading: partnerBest > 0 && mine > partnerBest,
    streakDays: streakOf(new Set(byDay.keys()), today).days,
    unlocked: unlockedFish(entries, userId, monthsWon(entries, memberIds, userId, today)),
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/celebrations/dayState.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing seen-unlocks test**

Create `src/features/celebrations/seenUnlocks.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import type { FishId } from '@/features/fish/catalog'
import { SEEN_UNLOCKS_KEY, loadSeenUnlocks, saveSeenUnlocks } from './seenUnlocks'

describe('seenUnlocks', () => {
  beforeEach(() => localStorage.clear())

  it('is null on a device that never recorded any', () => {
    expect(loadSeenUnlocks()).toBeNull()
  })

  it('round-trips a set', () => {
    saveSeenUnlocks(new Set<FishId>(['guppy', 'pufferfish']))
    expect(loadSeenUnlocks()).toEqual(new Set(['guppy', 'pufferfish']))
    expect(localStorage.getItem(SEEN_UNLOCKS_KEY)).toBe('["guppy","pufferfish"]')
  })

  it('drops values it does not recognise', () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, '["guppy","dragon",42]')
    expect(loadSeenUnlocks()).toEqual(new Set(['guppy']))
  })

  it('treats unreadable storage as never recorded', () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, '{not json')
    expect(loadSeenUnlocks()).toBeNull()
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/features/celebrations/seenUnlocks.test.ts`
Expected: FAIL — cannot find module `./seenUnlocks`.

- [ ] **Step 7: Implement `src/features/celebrations/seenUnlocks.ts`**

```ts
import { FISH_IDS, type FishId } from '@/features/fish/catalog'

export const SEEN_UNLOCKS_KEY = 'gymfishes:seen_unlocks'

function isFishId(v: unknown): v is FishId {
  return typeof v === 'string' && (FISH_IDS as readonly string[]).includes(v)
}

/** Fish already celebrated on this device; null when this device never recorded any (spec §6). */
export function loadSeenUnlocks(): Set<FishId> | null {
  try {
    const raw = localStorage.getItem(SEEN_UNLOCKS_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter(isFishId) : [])
  } catch {
    return null
  }
}

export function saveSeenUnlocks(seen: ReadonlySet<FishId>): void {
  try {
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify([...seen]))
  } catch {
    // storage blocked (private mode): the same fish may be celebrated again next time — harmless
  }
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/features/celebrations/seenUnlocks.test.ts`
Expected: PASS

- [ ] **Step 9: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/features/celebrations/dayState.ts src/features/celebrations/dayState.test.ts src/features/celebrations/seenUnlocks.ts src/features/celebrations/seenUnlocks.test.ts
git commit -m "feat: celebration day state and seen-unlocks storage"
```

**Cluster A ends here** — offer a pause before the art.

---
### Task 6: The `<Fish>` component and thirteen art files

**Files:**
- Create: `src/features/fish/svg/types.ts`, `src/features/fish/svg/index.ts`, and one file per fish: `svg/guppy.ts`, `svg/betta.ts`, `svg/goldfish.ts`, `svg/neon.ts`, `svg/pufferfish.ts`, `svg/clownfish.ts`, `svg/angelfish.ts`, `svg/octopus.ts`, `svg/seahorse.ts`, `svg/turtle.ts`, `svg/dolphin.ts`, `svg/shark.ts`, `svg/whale.ts`
- Create: `src/features/fish/Fish.tsx`, `src/features/fish/Fish.test.tsx`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Consumes: `FishId` (catalog).
- Produces:
  - `type Tone` — the token names fish may use
  - `type FishArt = { body; tail; tailPivot; fins; marks; eyes; colors }` (see `types.ts`)
  - `ART: Record<FishId, FishArt>`
  - `type FishState = 'idle' | 'still' | 'locked'`
  - `<Fish variant: FishId; size?: number (width px, default 24); state?: FishState (default 'still') />` — height follows the 64×40 viewBox; renders `<svg data-fish=… data-state=…>`; `idle` adds `.fish-tail` on the tail path and `.fish-bob` on the group; `locked` adds `.fish-locked` on the svg.

Every fish is the same five layers drawn in a fixed order — tail, body, fins, marks, eyes — in a shared 64×40 box, facing right. The path data below is a starting point: the executor is expected to eyeball the set at 56–72 px (Task 9's gallery is the place) and nudge coordinates freely, keeping the layer structure. Colours are token names only.

- [ ] **Step 1: Write the failing test**

Create `src/features/fish/Fish.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { FISH_IDS } from './catalog'
import { Fish } from './Fish'
import { ART } from './svg'

describe('Fish', () => {
  it('has art for all thirteen fish', () => {
    for (const id of FISH_IDS) {
      expect(ART[id].body, id).toMatch(/^M/)
      expect(ART[id].tail, id).toMatch(/^M/)
      expect(ART[id].eyes.length, id).toBeGreaterThan(0)
    }
  })

  it('renders every variant as an svg sized from the width', () => {
    for (const id of FISH_IDS) {
      const { container, unmount } = render(<Fish variant={id} size={64} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('data-fish', id)
      expect(svg).toHaveAttribute('width', '64')
      expect(svg).toHaveAttribute('height', '40')
      unmount()
    }
  })

  it('idle wags the tail and bobs; still does neither', () => {
    const idle = render(<Fish variant="betta" state="idle" />)
    expect(idle.container.querySelector('.fish-tail')).not.toBeNull()
    expect(idle.container.querySelector('.fish-bob')).not.toBeNull()
    idle.unmount()
    const still = render(<Fish variant="betta" state="still" />)
    expect(still.container.querySelector('.fish-tail')).toBeNull()
    expect(still.container.querySelector('.fish-bob')).toBeNull()
  })

  it('locked is a silhouette', () => {
    const { container } = render(<Fish variant="shark" state="locked" />)
    expect(container.querySelector('svg')).toHaveClass('fish-locked')
    expect(container.querySelector('.fish-tail')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/fish/Fish.test.tsx`
Expected: FAIL — cannot find module `./Fish`.

- [ ] **Step 3: Create `src/features/fish/svg/types.ts`**

```ts
/** Only existing tokens: the six member accents plus the ink scale (spec §8). */
export type Tone =
  | 'accent-blue'
  | 'accent-green'
  | 'accent-yellow'
  | 'accent-orange'
  | 'accent-purple'
  | 'accent-pink'
  | 'ink'
  | 'ink-2'
  | 'ink-3'
  | 'ink-on-water'

/**
 * Every fish is the same five layers, drawn in this order: tail, body, fins, marks, eyes.
 * Paths live in the shared 64×40 viewBox, facing right. Keep to these layers and any fish can
 * be redrawn — or swapped for a Rive file — without touching `Fish.tsx`.
 */
export type FishArt = {
  body: string
  tail: string
  /** Where the tail wag rotates around, in viewBox units. */
  tailPivot: readonly [number, number]
  fins: readonly string[]
  marks: readonly string[]
  eyes: readonly (readonly [number, number])[]
  colors: { body: Tone; tail: Tone; fins: Tone; marks: Tone }
}
```

- [ ] **Step 4: Create the thirteen art files**

`src/features/fish/svg/guppy.ts`:

```ts
import type { FishArt } from './types'

/** Guppy — a small blue body under a big orange fan tail (starter). */
export const guppy: FishArt = {
  body: 'M24 20 C24 12 32 8 40 8 C50 8 58 14 60 20 C58 26 50 32 40 32 C32 32 24 28 24 20 Z',
  tail: 'M25 20 C16 8 8 4 2 8 C6 14 6 26 2 32 C8 36 16 32 25 20 Z',
  tailPivot: [25, 20],
  fins: ['M32 10 L38 3 L46 9 Z'],
  marks: [
    'M39.5 14a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M34 24a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
    'M44.2 26a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0Z',
  ],
  eyes: [[52, 17]],
  colors: { body: 'accent-blue', tail: 'accent-orange', fins: 'accent-orange', marks: 'accent-orange' },
}
```

`src/features/fish/svg/betta.ts`:

```ts
import type { FishArt } from './types'

/** Betta — purple body with long pink veil fins (starter). */
export const betta: FishArt = {
  body: 'M18 20 C18 12 28 8 38 8 C48 8 56 14 58 20 C56 26 48 32 38 32 C28 32 18 28 18 20 Z',
  tail: 'M19 20 C14 6 6 4 2 10 C4 16 4 24 2 30 C6 36 14 34 19 20 Z',
  tailPivot: [19, 20],
  fins: ['M24 12 C26 2 40 0 48 8 C40 8 30 10 24 12 Z', 'M24 28 C26 38 40 40 48 32 C40 32 30 30 24 28 Z'],
  marks: [],
  eyes: [[50, 17]],
  colors: { body: 'accent-purple', tail: 'accent-pink', fins: 'accent-pink', marks: 'accent-pink' },
}
```

`src/features/fish/svg/goldfish.ts`:

```ts
import type { FishArt } from './types'

/** Peixe-dourado — round orange body, yellow double tail (starter). */
export const goldfish: FishArt = {
  body: 'M20 20 C20 10 30 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C30 34 20 30 20 20 Z',
  tail: 'M21 20 C14 12 8 6 4 8 C8 14 10 18 10 20 C10 22 8 26 4 32 C8 34 14 28 21 20 Z',
  tailPivot: [21, 20],
  fins: ['M30 8 L36 0 L44 6 Z'],
  marks: [],
  eyes: [[52, 17]],
  colors: { body: 'accent-orange', tail: 'accent-yellow', fins: 'accent-yellow', marks: 'accent-yellow' },
}
```

`src/features/fish/svg/neon.ts`:

```ts
import type { FishArt } from './types'

/** Neon — slim silver body, an electric blue stripe over a pink one (starter). */
export const neon: FishArt = {
  body: 'M16 20 C16 14 26 10 38 10 C48 10 56 15 60 20 C56 25 48 30 38 30 C26 30 16 26 16 20 Z',
  tail: 'M17 20 L6 12 L9 20 L6 28 Z',
  tailPivot: [17, 20],
  fins: ['M20 23 C30 27 46 27 55 22 L55 26 C46 31 30 31 20 27 Z'],
  marks: ['M18 17 C28 13 46 13 56 17 L56 20 C46 16 28 16 18 20 Z'],
  eyes: [[52, 17]],
  colors: { body: 'ink-2', tail: 'ink-2', fins: 'accent-pink', marks: 'accent-blue' },
}
```

`src/features/fish/svg/pufferfish.ts`:

```ts
import type { FishArt } from './types'

/** Baiacu — a yellow ball with spikes and orange spots (sequência de 7 dias). */
export const pufferfish: FishArt = {
  body: 'M12 20 C12 8 22 4 34 4 C46 4 58 10 60 20 C58 30 46 36 34 36 C22 36 12 32 12 20 Z',
  tail: 'M13 20 L4 14 L6 20 L4 26 Z',
  tailPivot: [13, 20],
  fins: [
    'M22 7 L24 1 L27 6 Z',
    'M32 4 L34 0 L37 4 Z',
    'M43 6 L46 1 L48 7 Z',
    'M22 33 L24 39 L27 34 Z',
    'M32 36 L34 40 L37 36 Z',
    'M43 34 L46 39 L48 33 Z',
  ],
  marks: [
    'M27 16a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M36 24a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z',
    'M24 26a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
    'M40 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z',
  ],
  eyes: [[50, 16]],
  colors: { body: 'accent-yellow', tail: 'accent-yellow', fins: 'ink-2', marks: 'accent-orange' },
}
```

`src/features/fish/svg/clownfish.ts`:

```ts
import type { FishArt } from './types'

/** Peixe-palhaço — orange with two white bands (sequência de 30 dias). */
export const clownfish: FishArt = {
  body: 'M16 20 C16 10 26 6 38 6 C50 6 58 14 60 20 C58 26 50 34 38 34 C26 34 16 30 16 20 Z',
  tail: 'M17 20 C12 12 8 12 4 14 C6 18 6 22 4 26 C8 28 12 28 17 20 Z',
  tailPivot: [17, 20],
  fins: ['M28 8 L34 1 L42 7 Z', 'M28 32 L34 39 L42 33 Z'],
  marks: ['M25 9 C24 16 24 24 25 31 L29 31 C28 24 28 16 29 9 Z', 'M41 7 C40 15 40 25 41 33 L45 33 C44 25 44 15 45 7 Z'],
  eyes: [[52, 17]],
  colors: { body: 'accent-orange', tail: 'accent-orange', fins: 'accent-orange', marks: 'ink' },
}
```

`src/features/fish/svg/angelfish.ts`:

```ts
import type { FishArt } from './types'

/** Peixe-anjo — tall silver disc, yellow sail fins, dark bars (sequência de 100 dias). */
export const angelfish: FishArt = {
  body: 'M20 20 C20 12 28 8 36 8 C46 8 54 14 58 20 C54 26 46 32 36 32 C28 32 20 28 20 20 Z',
  tail: 'M21 20 L8 10 L11 20 L8 30 Z',
  tailPivot: [21, 20],
  fins: ['M26 10 C28 0 42 0 48 9 Z', 'M26 30 C28 40 42 40 48 31 Z'],
  marks: ['M31 9 L29 31 L33 31 L35 9 Z', 'M43 9 L41 31 L45 31 L47 9 Z'],
  eyes: [[50, 17]],
  colors: { body: 'ink-2', tail: 'accent-yellow', fins: 'accent-yellow', marks: 'ink' },
}
```

`src/features/fish/svg/octopus.ts`:

```ts
import type { FishArt } from './types'

/** Polvo — purple dome, four tentacles (the left one wags as the "tail"), pink suckers (um dia acima de 5 L). */
export const octopus: FishArt = {
  body: 'M16 18 C16 4 48 4 48 18 C48 24 42 28 32 28 C22 28 16 24 16 18 Z',
  tail: 'M20 26 C14 30 10 36 14 39 C16 34 20 30 24 27 Z',
  tailPivot: [21, 26],
  fins: [
    'M26 27 C24 32 22 38 28 39 C28 34 30 30 31 27 Z',
    'M33 27 C34 30 36 34 36 39 C42 38 40 32 38 27 Z',
    'M40 27 C44 30 50 36 50 39 C54 36 48 30 44 26 Z',
  ],
  marks: [
    'M15 36a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M27 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M37 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
    'M48 35a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0Z',
  ],
  eyes: [
    [26, 16],
    [38, 16],
  ],
  colors: { body: 'accent-purple', tail: 'accent-purple', fins: 'accent-purple', marks: 'accent-pink' },
}
```

`src/features/fish/svg/seahorse.ts`:

```ts
import type { FishArt } from './types'

/** Cavalo-marinho — yellow S-curve facing right, orange snout and back fin, curled tail (100 L acumulados). */
export const seahorse: FishArt = {
  body: 'M36 6 C44 6 48 12 46 18 C44 22 40 24 38 26 L38 32 C38 36 34 40 28 38 C33 37 34 34 34 30 L34 26 C28 24 24 18 26 12 C28 8 32 6 36 6 Z',
  tail: 'M30 37 C26 40 20 36 24 32 C26 34 28 36 30 37 Z',
  tailPivot: [30, 37],
  fins: ['M46 14 L58 16 L46 19 Z', 'M26 14 C18 12 16 22 26 22 Z'],
  marks: [],
  eyes: [[39, 13]],
  colors: { body: 'accent-yellow', tail: 'accent-yellow', fins: 'accent-orange', marks: 'accent-orange' },
}
```

`src/features/fish/svg/turtle.ts`:

```ts
import type { FishArt } from './types'

/** Tartaruga — green shell with dark plates, head to the right (500 L acumulados). */
export const turtle: FishArt = {
  body: 'M14 20 C14 10 24 6 34 6 C44 6 54 10 54 20 C54 26 44 30 34 30 C24 30 14 26 14 20 Z',
  tail: 'M15 18 L8 20 L15 22 Z',
  tailPivot: [15, 20],
  fins: [
    'M54 20 C54 16 57 13 61 15 C63 17 63 23 61 25 C57 27 54 24 54 20 Z',
    'M22 28 L16 36 L28 31 Z',
    'M46 28 L52 36 L40 31 Z',
    'M22 12 L16 4 L28 9 Z',
    'M46 12 L52 4 L40 9 Z',
  ],
  marks: ['M28 12 L40 12 L44 20 L40 26 L28 26 L24 20 Z', 'M18 16 L24 14 L22 22 L18 22 Z', 'M50 16 L44 14 L46 22 L50 22 Z'],
  eyes: [[59, 18]],
  colors: { body: 'accent-green', tail: 'accent-green', fins: 'accent-green', marks: 'ink-on-water' },
}
```

`src/features/fish/svg/dolphin.ts`:

```ts
import type { FishArt } from './types'

/** Golfinho — sleek light grey with a pale belly (1000 L acumulados). */
export const dolphin: FishArt = {
  body: 'M12 22 C14 12 26 8 40 8 C50 8 58 14 62 20 L54 22 C50 28 40 32 28 30 C20 28 14 26 12 22 Z',
  tail: 'M13 22 C8 16 2 16 2 20 C4 22 4 24 2 28 C6 30 10 26 13 22 Z',
  tailPivot: [13, 22],
  fins: ['M30 9 C32 2 40 0 42 8 Z', 'M30 28 L28 36 L38 30 Z'],
  marks: ['M24 27 C34 31 46 29 54 23 L52 25 C44 31 32 33 24 29 Z'],
  eyes: [[52, 15]],
  colors: { body: 'ink-2', tail: 'ink-2', fins: 'ink-2', marks: 'ink' },
}
```

`src/features/fish/svg/shark.ts`:

```ts
import type { FishArt } from './types'

/** Tubarão — dark grey, pointed fins, lighter belly (ganhar 1 mês). */
export const shark: FishArt = {
  body: 'M12 20 C14 10 28 6 42 6 C52 6 60 14 62 20 C58 26 50 32 40 32 C28 32 16 30 12 20 Z',
  tail: 'M13 20 L2 6 L6 20 L2 32 Z',
  tailPivot: [13, 20],
  fins: ['M28 8 L36 0 L44 6 Z', 'M32 30 L28 38 L42 32 Z'],
  marks: ['M28 27 C36 32 50 28 58 22 L56 25 C48 32 34 34 28 30 Z'],
  eyes: [[52, 15]],
  colors: { body: 'ink-3', tail: 'ink-3', fins: 'ink-3', marks: 'ink-2' },
}
```

`src/features/fish/svg/whale.ts`:

```ts
import type { FishArt } from './types'

/** Baleia — big blue body, pale belly, broad tail (ganhar 3 meses). */
export const whale: FishArt = {
  body: 'M8 22 C8 10 22 6 38 6 C52 6 62 14 62 22 C62 28 56 32 46 32 L20 32 C12 32 8 28 8 22 Z',
  tail: 'M9 22 C4 14 0 14 0 18 C2 20 2 24 0 28 C4 30 8 28 9 22 Z',
  tailPivot: [9, 22],
  fins: ['M28 30 L24 38 L36 32 Z'],
  marks: ['M20 28 C30 34 48 32 58 26 L56 29 C46 36 28 36 20 31 Z'],
  eyes: [[52, 18]],
  colors: { body: 'accent-blue', tail: 'accent-blue', fins: 'accent-blue', marks: 'ink-2' },
}
```

- [ ] **Step 5: Create `src/features/fish/svg/index.ts`**

```ts
import type { FishId } from '../catalog'
import { angelfish } from './angelfish'
import { betta } from './betta'
import { clownfish } from './clownfish'
import { dolphin } from './dolphin'
import { goldfish } from './goldfish'
import { guppy } from './guppy'
import { neon } from './neon'
import { octopus } from './octopus'
import { pufferfish } from './pufferfish'
import { seahorse } from './seahorse'
import { shark } from './shark'
import { turtle } from './turtle'
import type { FishArt } from './types'
import { whale } from './whale'

export type { FishArt, Tone } from './types'

export const ART: Record<FishId, FishArt> = {
  guppy,
  betta,
  goldfish,
  neon,
  pufferfish,
  clownfish,
  angelfish,
  octopus,
  seahorse,
  turtle,
  dolphin,
  shark,
  whale,
}
```

- [ ] **Step 6: Create `src/features/fish/Fish.tsx`**

```tsx
import type { FishId } from './catalog'
import { ART, type Tone } from './svg'

export type FishState = 'idle' | 'still' | 'locked'

type Props = { variant: FishId; size?: number; state?: FishState }

const VIEW_W = 64
const VIEW_H = 40

function tone(t: Tone): string {
  return `var(--color-${t})`
}

/**
 * Flat SVG fish (spec §6 "Art"), facing right in a 64×40 box. `idle` wags the tail and bobs via
 * CSS keyframes — paused by a `data-waves="paused"` ancestor like the water, off under
 * prefers-reduced-motion. `locked` is a one-colour silhouette. This is the swap point if a fish
 * ever becomes a Rive file: callers never see what is inside.
 */
export function Fish({ variant, size = 24, state = 'still' }: Props) {
  const art = ART[variant]
  const idle = state === 'idle'
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={(size * VIEW_H) / VIEW_W}
      aria-hidden
      data-fish={variant}
      data-state={state}
      className={state === 'locked' ? 'fish-locked block' : 'block'}
    >
      <g className={idle ? 'fish-bob' : undefined}>
        <path
          d={art.tail}
          fill={tone(art.colors.tail)}
          className={idle ? 'fish-tail' : undefined}
          style={{ transformOrigin: `${art.tailPivot[0]}px ${art.tailPivot[1]}px` }}
        />
        <path d={art.body} fill={tone(art.colors.body)} />
        {art.fins.map((d) => (
          <path key={d} d={d} fill={tone(art.colors.fins)} />
        ))}
        {art.marks.map((d) => (
          <path key={d} d={d} fill={tone(art.colors.marks)} />
        ))}
        {art.eyes.map(([cx, cy]) => (
          <g key={`${cx},${cy}`}>
            <circle cx={cx} cy={cy} r={2.4} fill="var(--color-ink)" />
            <circle cx={cx + 0.6} cy={cy} r={1.2} fill="var(--color-ink-on-water)" />
          </g>
        ))}
      </g>
    </svg>
  )
}
```

`fill` is set as a presentation attribute on purpose: the `.fish-locked` CSS rule below overrides it (a class rule beats a presentation attribute), which is what turns any fish into a silhouette without a second set of paths.

- [ ] **Step 7: Add the fish CSS**

Append to `src/styles/globals.css`:

```css
/* Fish idle loop (spec §6): shape only — paused with the water, off under reduced motion. */
@keyframes fish-tail-wag {
  from { transform: rotate(-9deg); }
  to { transform: rotate(9deg); }
}
@keyframes fish-bob {
  from { transform: translateY(-1.5px); }
  to { transform: translateY(1.5px); }
}
.fish-tail { animation: fish-tail-wag 0.8s ease-in-out infinite alternate; }
.fish-bob { animation: fish-bob 2.4s ease-in-out infinite alternate; }
[data-waves='paused'] .fish-tail,
[data-waves='paused'] .fish-bob { animation-play-state: paused; }
.fish-locked path,
.fish-locked circle { fill: var(--color-ink-3); }
@media (prefers-reduced-motion: reduce) {
  .fish-tail, .fish-bob { animation: none; }
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/features/fish/Fish.test.tsx`
Expected: PASS

- [ ] **Step 9: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/features/fish/svg src/features/fish/Fish.tsx src/features/fish/Fish.test.tsx src/styles/globals.css
git commit -m "feat: flat SVG fish component with thirteen variants"
```

---
### Task 7: The fish swims in — tube, header, standings

**Files:**
- Move: `src/screens/registrar/useCountUp.ts` → `src/ui/useCountUp.ts`
- Modify: `src/screens/hoje/MemberTube.tsx`, `src/screens/hoje/ProgressStrip.tsx`, `src/screens/hoje/Hoje.tsx`, `src/screens/hoje/Hoje.test.tsx`, `src/screens/ranking/Standings.tsx`, `src/screens/registrar/RegisterSheet.tsx` (import path only)

**Interfaces:**
- Consumes: `Fish`, `fishOf`, `Member.fish_variant`.
- Produces:
  - `useCountUp(value: number, from: number = value): number` at `@/ui/useCountUp` — unchanged behaviour when `from` is omitted; `from` sets where the very first render starts counting
  - `MemberTube` gains a required `fishVariant: string` prop

- [ ] **Step 1: Move `useCountUp` and add `from`**

```bash
git mv src/screens/registrar/useCountUp.ts src/ui/useCountUp.ts
```

Replace the contents of `src/ui/useCountUp.ts` with:

```ts
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

/**
 * Animates `value` changes over 500 ms ease-out (spec §8 "Number count-up"). `from` is where the
 * first render starts — the tube leaves it at `value` (no jump on mount), the record screen
 * passes 0 so the number climbs. Reduced motion, or no matchMedia (tests), snaps.
 */
export function useCountUp(value: number, from: number = value): number {
  const [shown, setShown] = useState(from)
  const prev = useRef(from)
  useEffect(() => {
    const reduced =
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = prev.current
    prev.current = value
    if (reduced || start === value) {
      setShown(value)
      return
    }
    const controls = animate(start, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])
  return shown
}
```

In `src/screens/registrar/RegisterSheet.tsx` change `import { useCountUp } from './useCountUp'` to `import { useCountUp } from '@/ui/useCountUp'`.

- [ ] **Step 2: Write the failing Hoje test**

In `src/screens/hoje/Hoje.test.tsx`, change the second mocked member's fish so the two are distinguishable:

```ts
      { id: 'u2', display_name: 'Ana', fish_variant: 'betta', accent: 'pink', joined_at: '2' },
```

Append inside `describe('Hoje', …)`:

```ts
  it('draws each member fish on the tube and yours in the header', () => {
    renderHoje()
    // yours twice (header + tube), the partner's once
    expect(document.querySelectorAll('svg[data-fish="guppy"]')).toHaveLength(2)
    expect(document.querySelectorAll('svg[data-fish="betta"]')).toHaveLength(1)
    expect(screen.queryByText('🐟')).toBeNull()
  })
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/screens/hoje/Hoje.test.tsx`
Expected: FAIL — no `svg[data-fish]` yet; 🐟 still present.

- [ ] **Step 4: Put the fish in `MemberTube`**

Replace the contents of `src/screens/hoje/MemberTube.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fishOf } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { ACCENT_TEXT, accentOf } from '@/lib/accents'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { useCountUp } from '@/ui/useCountUp'
import { WaveSurface } from './WaveSurface'

type Props = {
  name: string
  isSelf: boolean
  accent: string
  fishVariant: string
  totalMl: number
  scaleMl: number
}

const FISH_KNEE = 70

/**
 * Where the fish floats for a given fill %. It rides the surface until the
 * water nears the top, then decelerates tangentially (no kink) and stops at
 * 85% — submerged under the wave instead of clipped above the tube, which the
 * leader would otherwise hit at exactly 100% once past the 3 L scale floor.
 */
export function fishLevel(pct: number): number {
  if (pct <= FISH_KNEE) return pct
  const x = pct - FISH_KNEE
  return FISH_KNEE + x - x ** 2 / (2 * (100 - FISH_KNEE))
}

export function MemberTube({ name, isSelf, accent, fishVariant, totalMl, scaleMl }: Props) {
  const pct = Math.min(100, (totalMl / scaleMl) * 100)
  const reduced = useReducedMotion()
  const spring = reduced
    ? { duration: 0.12 }
    : ({ type: 'spring', duration: 0.6, bounce: 0.25 } as const)
  const [splash, setSplash] = useState(false)
  const prev = useRef(totalMl)
  const shownTotal = useCountUp(totalMl)

  useEffect(() => {
    const grew = totalMl > prev.current
    prev.current = totalMl
    if (!grew || reduced) return
    setSplash(true)
    const t = window.setTimeout(() => setSplash(false), 450)
    return () => window.clearTimeout(t)
  }, [totalMl, reduced])

  return (
    <div className="w-[160px] shrink-0">
      <div className="relative h-[220px] overflow-hidden rounded-card border-2 border-line bg-surface-2">
        <motion.div className="absolute inset-x-0 bottom-0" animate={{ height: `${pct}%` }} transition={spring}>
          <span
            className="absolute inset-x-0 top-0 block"
            style={{
              transform: splash ? 'scaleY(2)' : 'scaleY(1)',
              transformOrigin: 'bottom',
              transition: 'transform 450ms ease-out',
            }}
          >
            <WaveSurface />
          </span>
          <div className="h-full w-full bg-water" />
        </motion.div>
        {totalMl > 0 ? (
          <motion.span
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2"
            animate={{ bottom: `${fishLevel(pct)}%` }}
            transition={spring}
          >
            <Fish variant={fishOf(fishVariant)} size={28} state="idle" />
          </motion.span>
        ) : null}
      </div>
      <p className="mt-2 text-center text-[17px] font-extrabold tracking-[-0.4px]">
        {formatVolume(shownTotal)}
      </p>
      <p
        className={`text-center text-[9px] font-extrabold uppercase tracking-[1px] ${ACCENT_TEXT[accentOf(accent)]}`}
      >
        {isSelf ? STRINGS.hoje.voce : name}
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Pass the variant from `ProgressStrip`**

In `src/screens/hoje/ProgressStrip.tsx`, add the prop to the `MemberTube` call:

```tsx
          <MemberTube
            key={m.id}
            name={m.display_name}
            isSelf={m.id === userId}
            accent={m.accent}
            fishVariant={m.fish_variant}
            totalMl={totals.get(m.id) ?? 0}
            scaleMl={scale}
          />
```

- [ ] **Step 6: Your fish in the Hoje header**

In `src/screens/hoje/Hoje.tsx`, add the imports:

```tsx
import { fishOf } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
```

Inside the component, after the `useGroupData()` line, add:

```tsx
  const me = members.find((m) => m.id === userId)
```

Replace the header button with:

```tsx
        <button
          type="button"
          aria-label={STRINGS.hoje.abrirPerfil}
          onClick={() => navigate('/perfil')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <Fish variant={fishOf(me?.fish_variant ?? '')} size={36} state="still" />
        </button>
```

- [ ] **Step 7: Fish in the standings row**

In `src/screens/ranking/Standings.tsx`, add the imports:

```tsx
import { fishOf } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
```

Replace the placeholder

```tsx
            <span aria-hidden className="text-[17px]">
              🐟
            </span>
```

with

```tsx
            <Fish variant={fishOf(member?.fish_variant ?? '')} size={22} state="still" />
```

and in the doc comment replace `🐟 is the M5 placeholder.` with `The fish is the member's chosen variant.`

- [ ] **Step 8: Run tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS — Hoje's `'1,8 L'` count assertions still hold (the count-up snaps in jsdom, which has no `matchMedia`).

- [ ] **Step 9: Look at it**

Run: `npm run dev`. On **Hoje**: each tube shows its member's fish riding the surface, tail wagging and gently bobbing; the total under the tube counts up when you register; the header shows your fish. Switch tabs and come back — the animation resumes. Open **Ranking**: a small fish per row. If a fish reads badly at this size, nudge its path data in `svg/<id>.ts` (keep the layers). Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add src/ui/useCountUp.ts src/screens/registrar/RegisterSheet.tsx src/screens/hoje/MemberTube.tsx src/screens/hoje/ProgressStrip.tsx src/screens/hoje/Hoje.tsx src/screens/hoje/Hoje.test.tsx src/screens/ranking/Standings.tsx
git rm --cached src/screens/registrar/useCountUp.ts 2>/dev/null || true
git commit -m "feat: SVG fish on the tube, header and standings; tube total counts up"
```

(The `git mv` already staged the rename; the `git rm --cached` line is a no-op safety net if the move was done by hand.)

---

### Task 8: Streak chip on the registers card

**Files:**
- Modify: `src/screens/hoje/RegistersCard.tsx`, `src/screens/hoje/Hoje.test.tsx`

**Interfaces:**
- Consumes: `registeredDays`, `streakOf` (streaks); `STRINGS.hoje.streak`.

- [ ] **Step 1: Write the failing test**

Append inside `describe('Hoje', …)` in `src/screens/hoje/Hoje.test.tsx`:

```ts
  it('shows the streak chip once you registered today', () => {
    renderHoje()
    expect(screen.getByText('🔥 1 dia')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/hoje/Hoje.test.tsx`
Expected: FAIL — no `🔥 1 dia`.

- [ ] **Step 3: Implement the chip**

Replace the contents of `src/screens/hoje/RegistersCard.tsx`:

```tsx
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { registeredDays, streakOf } from '@/lib/streaks'
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
  const streak = streakOf(registeredDays(entries, userId), today)

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
          {STRINGS.hoje.registrosDeHoje} · {todays.length}
        </h2>
        {streak.days > 0 ? (
          <span
            className={`rounded-[99px] bg-streak px-2 py-0.5 text-[11px] font-extrabold text-ink-on-water ${
              streak.atRisk ? 'opacity-50' : ''
            }`}
          >
            {STRINGS.hoje.streak(streak.days)}
          </span>
        ) : null}
      </div>
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

The chip is the flat yellow of the first-place badge (spec §4 "yellow chip"); "at risk" is the same chip at half opacity, and it disappears at 0 (call 12).

- [ ] **Step 4: Run tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/hoje/RegistersCard.tsx src/screens/hoje/Hoje.test.tsx
git commit -m "feat: streak chip on Hoje"
```

**Cluster B ends here** — offer a pause before the gallery.

---
### Task 9: Fish gallery in Perfil

**Files:**
- Create: `src/features/fish/FishGrid.tsx`, `src/features/fish/FishGrid.test.tsx`, `src/screens/perfil/FishGallery.tsx`
- Modify: `src/screens/perfil/Perfil.tsx`, `src/screens/perfil/Perfil.test.tsx`, `src/features/profile/mutations.ts`

**Interfaces:**
- Consumes: `FISH_IDS`, `UNLOCKS`, `fishName`, `fishOf`, `unlockLabel`, `FishId`; `Fish`; `unlockedFish`; `monthsWon`; `useGroupData`; `updateProfile`.
- Produces:
  - `<FishGrid variants: readonly FishId[]; unlocked: ReadonlySet<FishId>; selected: FishId | null; onSelect: (id: FishId) => void; disabled?: boolean />` — a `<ul>` of buttons named by the fish (aria-label), `aria-pressed` on the selected one, locked ones disabled with the condition text
  - `<FishGallery userId: string; current: string; busy: boolean; onSelect: (fish: FishId) => void />` — the "Seu peixe" card
  - `updateProfile(id, patch: { display_name?: string; accent?: string; fish_variant?: string })`

- [ ] **Step 1: Write the failing grid test**

Create `src/features/fish/FishGrid.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FISH_IDS, type FishId } from './catalog'
import { FishGrid } from './FishGrid'

const unlocked: ReadonlySet<FishId> = new Set<FishId>(['guppy', 'betta', 'goldfish', 'neon', 'pufferfish'])

describe('FishGrid', () => {
  it('lists every fish by name, marking the selected one', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected="betta" onSelect={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(13)
    expect(screen.getByRole('button', { name: 'Betta' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Guppy' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('locked fish are silhouettes with their condition and cannot be picked', () => {
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={vi.fn()} />)
    const shark = screen.getByRole('button', { name: 'Tubarão' })
    expect(shark).toBeDisabled()
    expect(shark).toHaveTextContent('Ganhar 1 mês')
    expect(shark.querySelector('svg')).toHaveAttribute('data-state', 'locked')
    expect(screen.getByRole('button', { name: 'Baiacu' })).toBeEnabled()
  })

  it('picking an unlocked fish reports its id', async () => {
    const onSelect = vi.fn()
    render(<FishGrid variants={FISH_IDS} unlocked={unlocked} selected={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Baiacu' }))
    expect(onSelect).toHaveBeenCalledWith('pufferfish')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/fish/FishGrid.test.tsx`
Expected: FAIL — cannot find module `./FishGrid`.

- [ ] **Step 3: Implement `src/features/fish/FishGrid.tsx`**

```tsx
import { STRINGS } from '@/lib/strings'
import { fishName, unlockLabel, UNLOCKS, type FishId } from './catalog'
import { Fish } from './Fish'

type Props = {
  variants: readonly FishId[]
  unlocked: ReadonlySet<FishId>
  selected: FishId | null
  onSelect: (id: FishId) => void
  disabled?: boolean
}

/**
 * The gallery grid (spec §5.5): unlocked fish in colour and tappable, locked ones as flat
 * silhouettes with their condition. Also the onboarding picker, fed the four starters.
 */
export function FishGrid({ variants, unlocked, selected, onSelect, disabled = false }: Props) {
  return (
    <ul aria-label={STRINGS.peixes.galeria} className="grid grid-cols-4 gap-2">
      {variants.map((id) => {
        const open = unlocked.has(id)
        const picked = selected === id
        return (
          <li key={id}>
            <button
              type="button"
              aria-label={fishName(id)}
              aria-pressed={picked}
              disabled={disabled || !open}
              onClick={() => onSelect(id)}
              className={`flex min-h-[44px] w-full flex-col items-center rounded-control bg-surface-2 px-1 py-2 ${
                picked ? 'border-2 border-water' : 'border border-line'
              }`}
            >
              <Fish variant={id} size={56} state={open ? 'still' : 'locked'} />
              <span className={`mt-1 text-[11px] font-bold ${open ? 'text-ink' : 'text-ink-3'}`}>{fishName(id)}</span>
              {open ? null : (
                <span className="mt-0.5 text-center text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">
                  {unlockLabel(UNLOCKS[id])}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Run the grid test**

Run: `npx vitest run src/features/fish/FishGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing Perfil tests**

In `src/screens/perfil/Perfil.test.tsx`, add one more mock next to the others (the gallery derives unlocks from the mirror):

```ts
vi.mock('@/features/entries/queries', () => ({ useEntries: () => ({ data: [] }) }))
```

Append inside `describe('Perfil', …)`:

```ts
  it('shows your fish and opens the gallery in place', async () => {
    renderWithProviders(<Perfil />)
    expect(screen.getByText('Guppy')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Baiacu' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
    expect(screen.getByRole('button', { name: 'Baiacu' })).toBeDisabled()
    expect(screen.getByText('Sequência de 7 dias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guppy' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('picking an unlocked fish saves it', async () => {
    renderWithProviders(<Perfil />)
    await userEvent.click(screen.getByRole('button', { name: /Trocar peixe/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Betta' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { fish_variant: 'betta' })
  })
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/screens/perfil/Perfil.test.tsx`
Expected: FAIL — no "Guppy", no "Trocar peixe".

- [ ] **Step 7: Widen the profile patch**

In `src/features/profile/mutations.ts` change the `updateProfile` signature to:

```ts
export async function updateProfile(
  id: string,
  patch: { display_name?: string; accent?: string; fish_variant?: string },
): Promise<void> {
```

- [ ] **Step 8: Create `src/screens/perfil/FishGallery.tsx`**

```tsx
import { useState } from 'react'
import { FISH_IDS, fishName, fishOf, type FishId } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { FishGrid } from '@/features/fish/FishGrid'
import { unlockedFish } from '@/features/fish/unlocks'
import { useGroupData } from '@/features/group/useGroupData'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import { monthsWon } from '@/lib/wrapup'

type Props = { userId: string; current: string; busy: boolean; onSelect: (fish: FishId) => void }

/** "Seu peixe" (spec §5.5): your fish large; tap to expand the gallery in place. Unlocks are derived here. */
export function FishGallery({ userId, current, busy, onSelect }: Props) {
  const { members, entries } = useGroupData()
  const [open, setOpen] = useState(false)
  const fish = fishOf(current)
  const wins = monthsWon(entries, members.map((m) => m.id), userId, dayKey(new Date()))
  const unlocked = unlockedFish(entries, userId, wins)

  return (
    <section className="mb-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[9px] font-extrabold uppercase tracking-[1px] text-ink-3">{STRINGS.peixes.seuPeixe}</h2>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center gap-4 text-left"
      >
        <Fish variant={fish} size={72} state="idle" />
        <span className="text-[17px] font-extrabold">{fishName(fish)}</span>
        <span className="ml-auto text-[13px] font-bold text-water">
          {open ? STRINGS.peixes.fechar : STRINGS.peixes.trocarPeixe}
        </span>
      </button>
      {open ? (
        <div className="mt-3">
          <FishGrid variants={FISH_IDS} unlocked={unlocked} selected={fish} disabled={busy} onSelect={onSelect} />
        </div>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 9: Mount it in Perfil**

In `src/screens/perfil/Perfil.tsx`, add the import:

```tsx
import { FishGallery } from './FishGallery'
```

Widen `save`:

```tsx
  async function save(patch: { display_name?: string; accent?: string; fish_variant?: string }) {
```

Insert the card as the first thing after the `<header>` (spec §5.5 lists "Seu peixe" first):

```tsx
      {userId ? (
        <FishGallery
          userId={userId}
          current={profile.fish_variant}
          busy={busy}
          onSelect={(fish) => save({ fish_variant: fish })}
        />
      ) : null}
```

`save` already invalidates `['bootstrap']` and `['members']`, so the header fish, the tube and the partner's roster all pick up the change.

- [ ] **Step 10: Run tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 11: Look at it**

Run: `npm run dev`, open **Perfil**. Your fish sits large at the top, wagging. Tap "Trocar peixe": four rows of fish, the locked ones as grey silhouettes with their condition underneath, your current one outlined in blue. This is the moment to judge the thirteen shapes side by side — nudge any path in `svg/<id>.ts` that doesn't read as its animal. Pick another starter: the header fish on Hoje changes. Stop the dev server.

- [ ] **Step 12: Commit**

```bash
git add src/features/fish/FishGrid.tsx src/features/fish/FishGrid.test.tsx src/screens/perfil/FishGallery.tsx src/screens/perfil/Perfil.tsx src/screens/perfil/Perfil.test.tsx src/features/profile/mutations.ts src/features/fish/svg
git commit -m "feat: fish gallery in Perfil"
```

---

### Task 10: Fish picker in onboarding

**Files:**
- Modify: `src/screens/onboarding/Onboarding.tsx`, `src/screens/onboarding/Onboarding.test.tsx`

**Interfaces:**
- Consumes: `FishGrid`, `STARTERS`, `FishId`, `updateProfile`, `STRINGS.onboarding.tituloPeixe`.
- Produces: a new `peixe` stage between `nome` and `grupo`; tapping a fish saves `fish_variant` and advances (call 13).

- [ ] **Step 1: Rewrite the test file**

Replace the contents of `src/screens/onboarding/Onboarding.test.tsx` — every flow now passes through the fish step:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

const createProfile = vi.fn()
const updateProfile = vi.fn()
const createGroup = vi.fn()
const joinGroup = vi.fn()

vi.mock('@/features/profile/mutations', () => ({
  createProfile: (...a: unknown[]) => createProfile(...a),
  updateProfile: (...a: unknown[]) => updateProfile(...a),
}))
vi.mock('@/features/group/mutations', () => ({
  createGroup: (...a: unknown[]) => createGroup(...a),
  joinGroup: (...a: unknown[]) => joinGroup(...a),
}))
vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'user-1' } }, loading: false }),
}))

/** Name → fish: the two steps every later flow has to pass. */
async function throughNameAndFish(fish = 'Guppy') {
  await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  await userEvent.click(await screen.findByRole('button', { name: fish }))
}

describe('Onboarding', () => {
  beforeEach(() => {
    createProfile.mockReset().mockResolvedValue(undefined)
    updateProfile.mockReset().mockResolvedValue(undefined)
    createGroup.mockReset().mockResolvedValue({ id: 'group-1', inviteCode: 'ABC234' })
    joinGroup.mockReset().mockResolvedValue('group-1')
  })

  it('rejects a name shorter than two characters', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'L')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Use pelo menos 2 caracteres')).toBeInTheDocument()
    expect(createProfile).not.toHaveBeenCalled()
  })

  it('creates the profile then offers the four starter fish', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Leo')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(createProfile).toHaveBeenCalledWith('user-1', 'Leo')
    expect(await screen.findByText('Escolha seu peixe')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Peixe-dourado' })).toBeEnabled()
  })

  it('picking a fish saves it and offers both group options', async () => {
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish('Betta')
    expect(updateProfile).toHaveBeenCalledWith('user-1', { fish_variant: 'betta' })
    expect(await screen.findByRole('button', { name: 'Criar grupo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar com código' })).toBeInTheDocument()
  })

  it('creates a group, shows the invite code, then finishes on Continuar', async () => {
    const onDone = vi.fn()
    render(<Onboarding onDone={onDone} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Criar grupo' }))
    await userEvent.type(screen.getByLabelText('Nome do grupo'), 'Fitness Fishes')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(createGroup).toHaveBeenCalledWith('Fitness Fishes', 'user-1')
    expect(await screen.findByText('ABC234')).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onDone).toHaveBeenCalled()
  })

  it('joins with a code and finishes', async () => {
    const onDone = vi.fn()
    render(<Onboarding onDone={onDone} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ABC234')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(joinGroup).toHaveBeenCalledWith('ABC234')
    expect(onDone).toHaveBeenCalled()
  })

  it('shows a pt-BR error for an invalid code', async () => {
    joinGroup.mockRejectedValue(new Error('invalid_code'))
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar com código' }))
    await userEvent.type(screen.getByLabelText('Código do convite'), 'ZZZZZZ')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Código inválido')).toBeInTheDocument()
  })

  it('stays on the fish step with an error when saving the fish fails', async () => {
    updateProfile.mockRejectedValueOnce(new Error('down'))
    render(<Onboarding onDone={vi.fn()} />)
    await throughNameAndFish()
    expect(await screen.findByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
    expect(screen.getByText('Escolha seu peixe')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/screens/onboarding/Onboarding.test.tsx`
Expected: FAIL — no "Escolha seu peixe"; flows that expect "Criar grupo" after picking a fish fail on the fish button.

- [ ] **Step 3: Add the stage**

In `src/screens/onboarding/Onboarding.tsx`:

Imports — extend the profile import and add two lines:

```tsx
import { createProfile, updateProfile } from '@/features/profile/mutations'
import { STARTERS, type FishId } from '@/features/fish/catalog'
import { FishGrid } from '@/features/fish/FishGrid'
```

Stage type:

```tsx
type Stage = 'nome' | 'peixe' | 'grupo' | 'criar' | 'entrar' | 'codigo'
```

In `submitNome`, change `setStage('grupo')` to `setStage('peixe')`.

After `submitNome`, add:

```tsx
  async function pickPeixe(fish: FishId) {
    setError('')
    if (!userId) return setError(STRINGS.erro.generico)
    setBusy(true)
    try {
      await updateProfile(userId, { fish_variant: fish })
      setStage('grupo')
    } catch {
      setError(STRINGS.erro.generico)
    } finally {
      setBusy(false)
    }
  }
```

In the JSX, between the `nome` block and the `grupo` block, add:

```tsx
      {stage === 'peixe' ? (
        <>
          <h1 className="mb-8 text-[24px] font-extrabold tracking-tight">
            {STRINGS.onboarding.tituloPeixe}
          </h1>
          <FishGrid
            variants={STARTERS}
            unlocked={new Set(STARTERS)}
            selected={null}
            disabled={busy}
            onSelect={pickPeixe}
          />
          {error ? <p className="mt-3 text-[13px] text-danger">{error}</p> : null}
        </>
      ) : null}
```

The file lands just under 200 lines; the five stages are one flow and splitting them would be structure for its own sake.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/onboarding/Onboarding.tsx src/screens/onboarding/Onboarding.test.tsx
git commit -m "feat: onboarding fish picker"
```

**Cluster C ends here** — offer a pause before the celebrations.

---
### Task 11: The full-screen celebration

**Files:**
- Create: `src/features/celebrations/CelebrationScreen.tsx`, `src/features/celebrations/CelebrationScreen.test.tsx`

**Interfaces:**
- Consumes: `FullScreenCelebration`, `celebrationText` (engine); `Fish`; `fishName`, `FishId`; `useCountUp(value, from)`; `Button`; `formatVolume`; `STRINGS.celebracoes`.
- Produces:
  - `AUTO_DISMISS_MS = 4000`
  - `<CelebrationScreen celebration: FullScreenCelebration; onClose: () => void; onChoose: (fish: FishId) => void />` — `role="dialog"` named by `celebrationText`; tap anywhere → `onClose`; record and streak auto-close after 4 s; the unlock shows "Escolher agora" (→ `onChoose(fish)`) and "Depois" (→ `onClose`) and never auto-closes (call 9)

- [ ] **Step 1: Write the failing test**

Create `src/features/celebrations/CelebrationScreen.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CelebrationScreen } from './CelebrationScreen'

describe('CelebrationScreen', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
  afterEach(() => vi.useRealTimers())

  it('announces a record and auto-dismisses after 4 seconds', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'record', ml: 4200 }} onClose={onClose} onChoose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Novo recorde! 4,2 L' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3999))
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('dismisses on tap', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'streak', days: 30 }} onClose={onClose} onChoose={vi.fn()} />)
    expect(screen.getByText('🔥 30 dias seguidos!')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('the unlock screen shows the fish, waits for a choice, and reports it', () => {
    const onClose = vi.fn()
    const onChoose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} onClose={onClose} onChoose={onChoose} />)
    expect(screen.getByText('Novo peixe!')).toBeInTheDocument()
    expect(screen.getByText('Baiacu')).toBeInTheDocument()
    expect(document.querySelector('svg[data-fish="pufferfish"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher agora' }))
    expect(onChoose).toHaveBeenCalledWith('pufferfish')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Depois just closes', () => {
    const onClose = vi.fn()
    render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'shark' }} onClose={onClose} onChoose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Depois' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

Only `setTimeout`/`clearTimeout` are faked so `motion`'s `requestAnimationFrame` loop keeps running normally.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/celebrations/CelebrationScreen.test.tsx`
Expected: FAIL — cannot find module `./CelebrationScreen`.

- [ ] **Step 3: Implement `src/features/celebrations/CelebrationScreen.tsx`**

```tsx
import { useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fishName, type FishId } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { useCountUp } from '@/ui/useCountUp'
import { celebrationText, type FullScreenCelebration } from './engine'

export const AUTO_DISMISS_MS = 4000

/** Horizontal positions (%) of the six bubbles that rise behind the content. */
const BUBBLES = [8, 24, 41, 58, 75, 90]

type Props = {
  celebration: FullScreenCelebration
  onClose: () => void
  onChoose: (fish: FishId) => void
}

/**
 * The one full screen a register may earn (spec §7). Tap anywhere to dismiss; record and streak
 * also leave on their own after 4 s, while the unlock waits for "Escolher agora" / "Depois".
 * Flat shapes only: bubbles rise, the content springs up, the number counts. Reduced motion
 * collapses everything to a 120 ms crossfade.
 */
export function CelebrationScreen({ celebration, onClose, onChoose }: Props) {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (celebration.kind === 'unlock') return
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS)
    return () => window.clearTimeout(t)
  }, [celebration, onClose])

  const fade = { duration: reduced ? 0.12 : 0.25 }
  const spring = reduced ? { duration: 0.12 } : ({ type: 'spring', duration: 0.9, bounce: 0.35 } as const)

  return (
    <motion.div
      role="dialog"
      aria-label={celebrationText(celebration)}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade}
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col items-center justify-center overflow-hidden bg-bg/95 px-6 text-center"
    >
      {reduced
        ? null
        : BUBBLES.map((left, i) => (
            <motion.span
              key={left}
              aria-hidden
              className="absolute bottom-0 h-3 w-3 rounded-full border-2 border-water-hi"
              style={{ left: `${left}%` }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -360, opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, delay: i * 0.12, ease: 'easeOut' }}
            />
          ))}
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 60 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <Body celebration={celebration} />
      </motion.div>
      {celebration.kind === 'unlock' ? (
        <div className="mt-8 w-full">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onChoose(celebration.fish)
            }}
          >
            {STRINGS.celebracoes.escolherAgora}
          </Button>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            {STRINGS.celebracoes.depois}
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}

function Body({ celebration }: { celebration: FullScreenCelebration }) {
  switch (celebration.kind) {
    case 'unlock':
      return (
        <>
          <div className="flex justify-center">
            <Fish variant={celebration.fish} size={160} state="idle" />
          </div>
          <p className="mt-6 text-[24px] font-extrabold tracking-tight">{STRINGS.celebracoes.novoPeixe}</p>
          <p className="mt-1 text-[17px] font-bold text-ink-2">{fishName(celebration.fish)}</p>
        </>
      )
    case 'record':
      return <Record ml={celebration.ml} />
    case 'streak':
      return (
        <p className="text-[38px] font-extrabold tracking-[-0.4px] text-streak">
          {STRINGS.celebracoes.diasSeguidos(celebration.days)}
        </p>
      )
  }
}

function Record({ ml }: { ml: number }) {
  const shown = useCountUp(ml, 0)
  return (
    <p className="text-[38px] font-extrabold tracking-[-0.4px] text-water">
      {STRINGS.celebracoes.novoRecorde(formatVolume(shown))}
    </p>
  )
}
```

The bubbles are bordered circles with no fill — flat shape, no glow. There is deliberately no exit animation (call 18), so the screen unmounts the instant it is dismissed.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/celebrations/CelebrationScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/celebrations/CelebrationScreen.tsx src/features/celebrations/CelebrationScreen.test.tsx
git commit -m "feat: full-screen celebration screen"
```

---

### Task 12: Celebration provider and the register path

**Files:**
- Create: `src/features/celebrations/CelebrationProvider.tsx`, `src/features/celebrations/CelebrationProvider.test.tsx`
- Modify: `src/features/entries/mutations.ts`, `src/features/entries/mutations.test.tsx`, `src/screens/registrar/submit.ts`, `src/screens/registrar/submit.test.ts`, `src/screens/registrar/RegisterSheet.tsx`, `src/screens/registrar/RegisterSheet.test.tsx`, `src/screens/hoje/ProgressStrip.tsx`, `src/app/AppShell.tsx`, `src/app/AppShell.test.tsx`

**Interfaces:**
- Consumes: `dayStateOf`, `celebrationsFor`, `present`, `celebrationText`, `FullScreenCelebration`; `loadSeenUnlocks`, `saveSeenUnlocks`; `CelebrationScreen`; `useGroupData`; `updateProfile`; `useToast`; `upsertEntry`, `Entry`.
- Produces:
  - `useEntryOps(...).insert(input: NewEntry): Entry` — now returns the optimistic row it put in the cache
  - `submitDraft(ops, userId, draft, entry): Entry | null` — the inserted row, `null` for an edit
  - `useCelebrations(): { celebrate: (before: readonly Entry[], after: readonly Entry[]) => void; inline: string | null }` — no-op defaults outside the provider
  - `<CelebrationProvider>` — mounted in `AppShell` inside `ToastProvider`

- [ ] **Step 1: `insert` returns the row — failing test**

In `src/features/entries/mutations.test.tsx`, in the test `'insert patches the cache optimistically …'`, replace the line `ops.insert(novo)` with:

```ts
    const row = ops.insert(novo)
    expect(row.id).toBe('e2')
    expect(row.updated_at).toBe('')
```

Run: `npx vitest run src/features/entries/mutations.test.tsx`
Expected: FAIL — `row` is `undefined` (TypeScript also flags `void`).

- [ ] **Step 2: Return the optimistic row**

In `src/features/entries/mutations.ts`, replace the `insert` method:

```ts
      insert(input: NewEntry): Entry {
        const row = optimisticRow(input, groupId)
        void patchAndEnqueue(client, groupId, (l) => upsertEntry(l, row), {
          type: 'insert',
          id: input.id,
          groupId,
          profileId,
          row: toRow(input, groupId),
          ...(input.photo ? { photo: input.photo } : {}),
        })
        return row
      },
```

Run: `npx vitest run src/features/entries/mutations.test.tsx`
Expected: PASS

- [ ] **Step 3: `submitDraft` returns it — failing test**

Append inside `describe('submitDraft', …)` in `src/screens/registrar/submit.test.ts`:

```ts
  it('returns the optimistic row from an insert, and null from an update', () => {
    ops.insert.mockReturnValue(entry)
    expect(submitDraft(ops, 'u1', draft({}), undefined)).toBe(entry)
    expect(submitDraft(ops, 'u1', draft({}), entry)).toBeNull()
  })
```

Run: `npx vitest run src/screens/registrar/submit.test.ts`
Expected: FAIL — `submitDraft` returns `undefined`.

- [ ] **Step 4: Return from `submitDraft`**

In `src/screens/registrar/submit.ts`:

```ts
/**
 * Submitting is a pure local enqueue — uploads and retries live in the outbox flusher — so the
 * sheet closes instantly whatever the connectivity (spec §5.2/§12). Returns the optimistic row
 * for a new register (the celebrations compare the mirror with and without it), null for an edit.
 */
export function submitDraft(
  ops: Pick<EntryOps, 'insert' | 'update'>,
  userId: string,
  draft: Draft,
  entry: Entry | undefined,
): Entry | null {
  const items = draftItems(draft)
  const note = draft.note.trim() || null
  const photo: OpPhoto | undefined = draft.photo
    ? { photo: draft.photo.blob, thumb: draft.photo.thumb }
    : undefined

  if (entry) {
    const patch: EntryPatch = {
      total_ml: totalMl(items),
      composition: items as Entry['composition'],
      note,
      drank_at: draft.drankAt.toISOString(),
      ...(draft.photoRemoved ? { photo_path: null, thumb_path: null } : {}),
    }
    ops.update(entry, patch, photo)
    return null
  }

  return ops.insert({
    id: crypto.randomUUID(),
    profileId: userId,
    totalMl: totalMl(items),
    composition: items,
    note,
    drankAt: draft.drankAt,
    photo: photo ?? null,
  })
}
```

Run: `npx vitest run src/screens/registrar/submit.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing provider test**

Create `src/features/celebrations/CelebrationProvider.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry } from '@/features/entries/cache'
import { addDays, dayKey } from '@/lib/dates'
import { renderWithProviders } from '@/test/utils'
import { ToastProvider } from '@/ui/Toast'
import { CelebrationProvider, useCelebrations } from './CelebrationProvider'
import { SEEN_UNLOCKS_KEY } from './seenUnlocks'

const updateProfile = vi.fn()
vi.mock('@/features/profile/mutations', () => ({
  updateProfile: (...args: unknown[]) => updateProfile(...args),
}))
vi.mock('@/features/group/useGroupData', () => ({
  useGroupData: () => ({
    userId: 'u1',
    groupId: 'g1',
    members: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
    entries: [],
  }),
}))

const today = dayKey(new Date())
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
    updated_at: '',
    deleted_at: null,
  }) as Entry

/** Six consecutive days ending yesterday — one register today makes seven. */
const sixDays = () => Array.from({ length: 6 }, (_, i) => row(`d${i}`, 'u1', 500, addDays(today, -(i + 1))))

function Trigger({ before, after }: { before: Entry[]; after: Entry[] }) {
  const { celebrate, inline } = useCelebrations()
  return (
    <>
      <button type="button" onClick={() => celebrate(before, after)}>
        go
      </button>
      <p data-testid="inline">{inline ?? ''}</p>
    </>
  )
}

function renderTrigger(before: Entry[], after: Entry[]) {
  return renderWithProviders(
    <ToastProvider>
      <CelebrationProvider>
        <Trigger before={before} after={after} />
      </CelebrationProvider>
    </ToastProvider>,
  )
}

describe('CelebrationProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    updateProfile.mockReset().mockResolvedValue(undefined)
  })

  it('shows the round litre inline when it is the only celebration', async () => {
    renderTrigger([], [row('e1', 'u1', 1000, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByTestId('inline')).toHaveTextContent('1 L hoje')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('toasts the lead and drops the outranked litre', async () => {
    const partner = row('e0', 'u2', 1000, today)
    renderTrigger([partner], [partner, row('e1', 'u1', 1200, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Você assumiu a liderança 🏆')
    expect(screen.getByTestId('inline')).toHaveTextContent('')
  })

  it('unlocks the pufferfish full screen once, toasts the streak, and remembers it', async () => {
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByRole('dialog', { name: 'Novo peixe! Baiacu' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('🔥 7 dias seguidos!')
    expect(JSON.parse(localStorage.getItem(SEEN_UNLOCKS_KEY) ?? '[]')).toContain('pufferfish')

    await userEvent.click(screen.getByRole('button', { name: 'Depois' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Escolher agora" saves the new fish and closes', async () => {
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    await userEvent.click(screen.getByRole('button', { name: 'Escolher agora' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { fish_variant: 'pufferfish' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('never re-celebrates a fish this device already saw', async () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify(['guppy', 'betta', 'goldfish', 'neon', 'pufferfish']))
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('🔥 7 dias seguidos!')
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/features/celebrations/CelebrationProvider.test.tsx`
Expected: FAIL — cannot find module `./CelebrationProvider`.

- [ ] **Step 7: Implement `src/features/celebrations/CelebrationProvider.tsx`**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Entry } from '@/features/entries/cache'
import type { FishId } from '@/features/fish/catalog'
import { useGroupData } from '@/features/group/useGroupData'
import { updateProfile } from '@/features/profile/mutations'
import { dayKey } from '@/lib/dates'
import { STRINGS } from '@/lib/strings'
import { useToast } from '@/ui/Toast'
import { CelebrationScreen } from './CelebrationScreen'
import { dayStateOf } from './dayState'
import { celebrationText, celebrationsFor, present, type FullScreenCelebration } from './engine'
import { loadSeenUnlocks, saveSeenUnlocks } from './seenUnlocks'

type Celebrations = {
  /** Call with the entries mirror before and after one of *your* inserts (spec §7). */
  celebrate: (before: readonly Entry[], after: readonly Entry[]) => void
  /** The round-litre caption while it is showing — Hoje puts it on the gap line. */
  inline: string | null
}

const CelebrationContext = createContext<Celebrations>({ celebrate: () => {}, inline: null })

export function useCelebrations(): Celebrations {
  return useContext(CelebrationContext)
}

/** How long "2 L hoje" replaces the gap line. */
const INLINE_MS = 2500

/**
 * Runs the engine after each of your registers and owns what it shows: at most one full screen,
 * the rest as one joined toast, the lone round litre inline. `seen_unlocks` (per device) is what
 * makes "exactly once" hold across sessions; it seeds itself the first time it is needed, so a
 * fresh device never re-celebrates fish you already have.
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { userId, members } = useGroupData()
  const client = useQueryClient()
  const toast = useToast()
  const [full, setFull] = useState<FullScreenCelebration | null>(null)
  const [inline, setInline] = useState<string | null>(null)
  const inlineTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(inlineTimer.current), [])

  const celebrate = useCallback(
    (before: readonly Entry[], after: readonly Entry[]) => {
      if (!userId) return
      const today = dayKey(new Date())
      const ids = members.map((m) => m.id)
      const b = dayStateOf(before, ids, userId, today)
      const a = dayStateOf(after, ids, userId, today)
      const seen = loadSeenUnlocks() ?? b.unlocked
      const shown = present(celebrationsFor({ ...b, unlocked: seen }, a))
      saveSeenUnlocks(new Set([...seen, ...a.unlocked]))
      if (shown.fullScreen) setFull(shown.fullScreen)
      if (shown.toasts.length > 0) toast(shown.toasts.map(celebrationText).join(STRINGS.celebracoes.separador))
      if (shown.inline) {
        setInline(celebrationText(shown.inline))
        window.clearTimeout(inlineTimer.current)
        inlineTimer.current = window.setTimeout(() => setInline(null), INLINE_MS)
      }
    },
    [userId, members, toast],
  )

  const close = useCallback(() => setFull(null), [])

  async function choose(fish: FishId) {
    setFull(null)
    if (!userId) return
    try {
      await updateProfile(userId, { fish_variant: fish })
      await client.invalidateQueries({ queryKey: ['bootstrap'] })
      await client.invalidateQueries({ queryKey: ['members'] })
    } catch {
      toast(STRINGS.erro.generico)
    }
  }

  const value = useMemo(() => ({ celebrate, inline }), [celebrate, inline])
  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {full ? <CelebrationScreen celebration={full} onClose={close} onChoose={choose} /> : null}
    </CelebrationContext.Provider>
  )
}
```

`close` is memoised on purpose: `CelebrationScreen` restarts its 4 s timer whenever `onClose` changes identity.

- [ ] **Step 8: Run the provider test**

Run: `npx vitest run src/features/celebrations/CelebrationProvider.test.tsx`
Expected: PASS

- [ ] **Step 9: Wire the sheet — failing test first**

In `src/screens/registrar/RegisterSheet.test.tsx`, add next to the other mocks (the sheet now reads the mirror through `useGroupData`):

```ts
vi.mock('@/features/group/queries', () => ({ useMembers: () => ({ data: [] }) }))
vi.mock('@/features/entries/queries', () => ({ useEntries: () => ({ data: [] }) }))
const celebrate = vi.fn()
vi.mock('@/features/celebrations/CelebrationProvider', () => ({
  useCelebrations: () => ({ celebrate: (...args: unknown[]) => celebrate(...args), inline: null }),
}))
```

Add `celebrate.mockReset()` to the `beforeEach`, and append inside `describe('RegisterSheet', …)`:

```ts
  it('hands the mirror before and after the insert to the celebrations', async () => {
    const inserted = {
      id: 'e9',
      profile_id: 'u1',
      group_id: 'g1',
      total_ml: 1500,
      composition: [],
      note: null,
      photo_path: null,
      thumb_path: null,
      drank_at: new Date().toISOString(),
      drank_on: '2026-09-08',
      created_at: new Date().toISOString(),
      updated_at: '',
      deleted_at: null,
    } as Entry
    insertMutate.mockReturnValue(inserted)
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Garrafa azul/ }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar 1,5 L/ }))
    expect(celebrate).toHaveBeenCalledWith([], [inserted])
  })
```

Run: `npx vitest run src/screens/registrar/RegisterSheet.test.tsx`
Expected: FAIL — `celebrate` never called.

- [ ] **Step 10: Wire the sheet**

In `src/screens/registrar/RegisterSheet.tsx`, replace the imports of `useSession` and `useBootstrap` and the first lines of the component. The import block becomes:

```tsx
import { useEffect, useReducer, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useBottles } from '@/features/bottles/queries'
import { useCelebrations } from '@/features/celebrations/CelebrationProvider'
import { upsertEntry, type Entry } from '@/features/entries/cache'
import { useEntryOps } from '@/features/entries/mutations'
import { useGroupData } from '@/features/group/useGroupData'
import { describeComposition, totalMl } from '@/lib/composition'
import { MAX_ML } from '@/lib/keypad'
import { formatVolume } from '@/lib/format'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'
import { useCountUp } from '@/ui/useCountUp'
import { BottleGrid } from './BottleGrid'
import { LooseAmount } from './LooseAmount'
import { OptionalChips } from './OptionalChips'
import { draftFromEntry, draftItems, draftReducer, emptyDraft } from './draft'
import { submitDraft } from './submit'
```

The component's first lines become:

```tsx
export function RegisterSheet({ entry, onClose }: { entry: Entry | undefined; onClose: () => void }) {
  const { userId, groupId: currentGroupId, entries } = useGroupData()
  const groupId = currentGroupId ?? ''
  const bottles = useBottles(userId)
  const ops = useEntryOps(groupId, userId ?? '')
  const { celebrate } = useCelebrations()
```

And `submit` becomes:

```tsx
  function submit() {
    if (!canSave || !userId || !groupId || submitted.current) return
    submitted.current = true
    const inserted = submitDraft(ops, userId, draft, entry)
    if (inserted) celebrate(entries, upsertEntry(entries, inserted))
    onClose()
  }
```

Run: `npx vitest run src/screens/registrar/RegisterSheet.test.tsx`
Expected: PASS

- [ ] **Step 11: The inline caption on Hoje**

In `src/screens/hoje/ProgressStrip.tsx`, add the import:

```tsx
import { useCelebrations } from '@/features/celebrations/CelebrationProvider'
```

After `const partner = …`, add:

```tsx
  const { inline } = useCelebrations()
  const caption =
    inline ?? (partner ? gapText(totals.get(userId) ?? 0, totals.get(partner.id) ?? 0, partner.display_name) : null)
```

Replace the gap-line JSX with:

```tsx
      {caption ? <p className="mt-3 text-center text-[13px] font-bold text-water">{caption}</p> : null}
```

Hoje's tests render without a provider and get the no-op default (`inline: null`), so they are unchanged.

- [ ] **Step 12: Mount the provider in the shell**

In `src/app/AppShell.tsx`, add the import:

```tsx
import { CelebrationProvider } from '@/features/celebrations/CelebrationProvider'
```

and wrap the body:

```tsx
  return (
    <ToastProvider>
      <CelebrationProvider>
        <div className="min-h-dvh pb-24">
          <ErrorBoundary key={location.pathname}>
            <Outlet
              context={{ openRegister: (entry?: Entry) => setSheet({ entry }) } satisfies ShellContext}
            />
          </ErrorBoundary>
          <AnimatePresence>
            {sheet ? <RegisterSheet entry={sheet.entry} onClose={() => setSheet(null)} /> : null}
          </AnimatePresence>
          <TabBar onRegister={() => setSheet({})} />
        </div>
      </CelebrationProvider>
    </ToastProvider>
  )
```

In `src/app/AppShell.test.tsx`, add next to the existing mocks (the provider now reaches the members and entries hooks):

```ts
vi.mock('@/features/group/queries', () => ({ useMembers: () => ({ data: [] }) }))
vi.mock('@/features/entries/queries', () => ({ useEntries: () => ({ data: [] }) }))
```

- [ ] **Step 13: Run everything and typecheck**

Run: `npm run test:run && npm run typecheck`
Expected: PASS

- [ ] **Step 14: Look at it**

Run: `npm run dev`. Register enough to cross a whole litre today: the tube surges, the total counts up and the gap line reads "2 L hoje" for a moment before returning. If your partner is ahead today, register enough to pass them: the toast "Você assumiu a liderança 🏆" appears. The full-screen paths are covered by the tests above; they will fire for real on your first record day and your seventh straight day — this is the cloud database, so don't fabricate a week of registers to see it. Stop the dev server.

- [ ] **Step 15: Commit**

```bash
git add src/features/celebrations/CelebrationProvider.tsx src/features/celebrations/CelebrationProvider.test.tsx src/features/entries/mutations.ts src/features/entries/mutations.test.tsx src/screens/registrar/submit.ts src/screens/registrar/submit.test.ts src/screens/registrar/RegisterSheet.tsx src/screens/registrar/RegisterSheet.test.tsx src/screens/hoje/ProgressStrip.tsx src/app/AppShell.tsx src/app/AppShell.test.tsx
git commit -m "feat: celebrations wired into the register path"
```

**Cluster D ends here** — offer a pause before the docs.

---
### Task 13: Docs — spec alignment and roadmap status

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (§2, §3, §5.1, §5.5, §6, §7, §8, §9, §16), `docs/superpowers/plans/ROADMAP.md`

- [ ] **Step 1: Align spec §2 (decision log)**

Replace the row

```
| Fish art | SVG components animated with GSAP | Rive's advantage is invisible at 20px and its WASM runtime outweighs the art |
```

with

```
| Fish art | Flat SVG components; CSS keyframes for the idle loop, `motion` for celebrations | Rive's advantage is invisible at 20px and its WASM runtime outweighs the art; a second animation library (GSAP) buys nothing `motion` and CSS don't already do |
```

- [ ] **Step 2: Align spec §3 (onboarding step 3)**

Replace

```
3. **Peixe** — pick one of the four starter fish. "Escolha seu peixe".
```

with

```
3. **Peixe** — pick one of the four starter fish. "Escolha seu peixe". Tapping a fish saves it
   and moves on.
```

- [ ] **Step 3: Align spec §5.1 and §5.5**

In §5.1 replace `**Registers card** — "Registros de hoje · 4" with the streak chip on the right.` with `**Registers card** — "Registros de hoje · 4" with the streak chip on the right (hidden while the streak is 0).`

In §5.5 replace `Tapping opens the fish gallery: a grid of all fish,` with `Tapping expands the fish gallery in place: a grid of all fish,`.

- [ ] **Step 4: Align spec §6**

Replace the signature block

```ts
unlockedFish(entries: Entry[], monthlyWins: number): Set<FishId>
```

with

```ts
unlockedFish(entries: Entry[], profileId: string, monthsWon: number): Set<FishId>
```

After the sentence `This means no extra table, no writes, no drift, and it self-heals if data changes.` add a new paragraph:

```
Every condition is an all-time fact — longest streak ever, best day ever, accumulated volume,
completed months won — so a fish never re-locks when a streak breaks. A month counts only once
it has ended, and a tie counts for nobody (the same rule as the wrap-up card).
```

Replace

```
"Newly unlocked, not yet celebrated" is tracked per device in `localStorage`
(`seen_unlocks`). On a fresh device you may miss a past unlock celebration; the fish is
still unlocked. Acceptable.
```

with

```
"Newly unlocked, not yet celebrated" is tracked per device in `localStorage`
(`seen_unlocks`). The set seeds itself with whatever is already unlocked the first time it is
needed, so a fresh device may miss a past celebration but never repeats one. The fish is
unlocked either way. Acceptable.
```

In **Art**, replace `rendering flat SVG using two or three palette colours` with `rendering flat SVG using two or three of the accent and ink tokens`; replace the interface line

```tsx
<Fish variant="betta" level={0.62} state="idle" size={20} />
```

with

```tsx
<Fish variant="betta" state="idle" size={20} />
```

and replace the paragraph

```
GSAP drives a slow tail rotation and vertical bob at rest, and a quick dart upward when a
register lands. `prefers-reduced-motion` disables both.
```

with

```
CSS keyframes drive a slow tail wag and vertical bob at rest, paused with the water whenever
the tube is hidden; the tube's own spring lifts the fish when a register lands.
`prefers-reduced-motion` disables both. States are `idle`, `still` and `locked` (a one-colour
silhouette for the gallery).
```

- [ ] **Step 5: Align spec §7**

In the table, replace `"Novo peixe! 🐡" + reveal + "Escolher agora" / "Depois"` with `"Novo peixe!" + the fish + "Escolher agora" / "Depois"`.

Replace the rule

```
- Full-screen celebrations dismiss on tap and auto-dismiss after 4 seconds.
```

with

```
- Record and streak screens dismiss on tap and auto-dismiss after 4 seconds; the unlock screen
  waits for "Escolher agora" or "Depois" (a tap outside counts as Depois).
- Only your own *new* registers from the sheet are evaluated — edits and deletes never fire;
  anything they unlock is celebrated at your next register (`seen_unlocks`).
- "Took the lead" means overtaking a partner who has registered today.
- Several toasts join into one line with " · ". The round-litre caption replaces the Hoje gap
  line for 2,5 s.
```

Replace `Implementation is a GSAP timeline per celebration type, over flat shapes` with `Implementation is a `motion` sequence per celebration type, over flat shapes`.

- [ ] **Step 6: Align spec §8 and §9**

In the §8 Motion table replace `| Celebration timeline | 900–1400 ms | GSAP timeline |` with `| Celebration sequence | 900–1400 ms | `motion` spring + stagger |`. Replace

```
`motion` handles component and layout transitions; GSAP handles choreographed celebration
sequences and the fish. `prefers-reduced-motion` collapses everything to a 120ms crossfade.
```

with

```
`motion` handles component and layout transitions and the celebration sequences; the water
and the fish idle loop are CSS keyframes. `prefers-reduced-motion` collapses everything to a
120ms crossfade.
```

In the §9 diagram replace `shadcn/ui  ·  motion  ·  GSAP` with `shadcn/ui  ·  motion` (keep the box width by padding with spaces). In the Stack table replace `| Animation | `motion` (UI) + GSAP (celebrations, fish) |` with `| Animation | `motion` (UI, celebrations) + CSS keyframes (water, fish idle) |`.

- [ ] **Step 7: Align spec §16**

In the tree:
- `registrar/` line: remove `useCountUp` from the list.
- `features/fish/` line: `catalog.ts unlocks.ts Fish.tsx FishGrid.tsx svg/`
- `features/celebrations/` line: `engine.ts dayState.ts seenUnlocks.ts CelebrationProvider.tsx CelebrationScreen.tsx`
- `ui/` line: `shadcn primitives + Button, Field, Card, Sheet, Segmented, Stepper, Toast, useCountUp`

- [ ] **Step 8: Update the roadmap**

In `docs/superpowers/plans/ROADMAP.md`, change the M5 row to:

```
| M5 | Peixes e celebrações | [`2026-09-08-m5-peixes-celebracoes.md`](2026-09-08-m5-peixes-celebracoes.md) | **code-complete** — pending owner verification: both fish on both phones; a round litre, an overtake, and the first real 7-day streak celebrating once |
```

Change the M6 row's status from `blocked by M5` to `ready`.

Append to the **M5 — Peixes e celebrações** section, after the bullet list:

```
**Deliberate sequencing note:** no GSAP — the fish idle loop is CSS keyframes (like the water)
and celebration choreography is `motion`, which already ships; the spec's decision log now says
so. `<Fish>` dropped the `level` prop (the tube positions it). Calls the spec left open — all-time
unlock facts, completed-months-only wins, inserts-only celebrations with a self-seeding
`seen_unlocks`, "lead" meaning an overtake, the unlock screen waiting for a button, joined toasts,
the litre caption on the gap line, a hidden 0-day chip, tap-to-save in onboarding, an in-place
gallery — are recorded in the plan and folded into spec §3/§5/§6/§7/§8.
```

- [ ] **Step 9: Run everything one last time**

Run: `npm run test:run && npm run typecheck && npm run build`
Expected: all PASS, build succeeds.

- [ ] **Step 10: Commit**

```bash
git add docs/superpowers/specs/2026-08-11-gymfishes-design.md docs/superpowers/plans/ROADMAP.md
git commit -m "docs: mark M5 code-complete; align spec 2/3/5/6/7/8/9/16"
```

---

## Owner verifications (manual, after code-complete)

1. **Fish on both phones** — each tube shows its owner's fish, wagging; change yours in Perfil and confirm the partner's phone shows it after they refocus the app. Open Ranking and the standings rows carry the same fish.
2. **Round litre** — register enough to cross a whole litre today; the gap line reads "2 L hoje" for a moment, the tube surges, the total counts up.
3. **Overtake** — when the partner is ahead today, register enough to pass them; the toast "Você assumiu a liderança 🏆" appears once, and not again on the next register.
4. **Day seven** — the first real seven-day streak shows the "Novo peixe!" screen with the Baiacu exactly once, on the phone where that register was made; the other phone shows it unlocked in Perfil with no celebration. Pick it with "Escolher agora" and both phones switch fish.
5. **Streak chip** — before the first register of a day, the chip shows yesterday's count at half opacity; after it, full opacity and +1.

## Notes for the reviewer

- **Everything is derived.** No table, view or RPC was added and `profiles.fish_variant` already existed. If the mirror is empty (fresh install, offline), every fish beyond the four starters shows locked — correct, not broken; it fills in after the first sync.
- **Why unlocks are all-time facts.** A derived set that could shrink would make the gallery flicker a fish away the morning after a missed day. Longest-streak-ever, best-day-ever and accumulated volume only grow; months won only grows because only completed months count.
- **Why `seen_unlocks` and not just the before/after diff.** The diff catches unlocks caused by the register itself. A month ending, or a backdated edit, unlocks a fish with no register to diff against — `seen_unlocks` catches those at the next register. Seeding it on first use is what keeps a new device from re-celebrating.
- **Why `insert` returns the row.** The celebration needs "the mirror with this register in it" synchronously, before the query cache has re-rendered anything. Returning the optimistic row lets the sheet build that list with `upsertEntry` and hand both lists to the provider — no subscriptions, no effects watching the cache.
- **Why celebrations only on inserts.** Edits can move water between days in ways the before/after model doesn't describe well (a record that was, a streak that wasn't). The value is in the moment you drink; edits are bookkeeping.
- **Accepted edge:** a fish `fish_variant` value the client doesn't know (say, after a future rename) renders as the guppy via `fishOf`. Nothing crashes.
- **Accepted edge:** the `today` used by the provider is the moment of the register. Registering at 23:59:58 and the sheet closing after midnight is not a case worth code.
- **Why fins draw on top of the body.** It lets a single-colour "fins" layer double as a second stripe (the neon) without another field. The five-layer structure is the only contract `Fish.tsx` has with the art.
- **Path data is a starting point.** The thirteen shapes were written blind; Task 9's gallery is where they get judged side by side. Nudging coordinates inside `svg/<id>.ts` is expected and needs no plan change as long as the five layers stay.
