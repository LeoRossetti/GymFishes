# GymFishes — Roadmap / Backlog

**Spec:** [`../specs/2026-08-11-gymfishes-design.md`](../specs/2026-08-11-gymfishes-design.md)
**Criado:** 2026-08-11

Six milestones. Each one ends with software that runs, is testable on a real
iPhone, and is worth using on its own. Each gets its own detailed plan document,
written immediately before it is executed so it can be written against the real
codebase rather than an imagined one.

| # | Milestone | Plan | Status |
|---|---|---|---|
| M1 | Foundation | [`2026-08-11-m1-foundation.md`](2026-08-11-m1-foundation.md) | **code-complete** — pending user handoff: Vercel deploy, two-phone install, cloud RLS behavioral checklist |
| M2 | Core loop — registrar e ver água | not written yet | blocked by M1 |
| M3 | Offline e sync | not written yet | blocked by M2 |
| M4 | Competição — Ranking e Histórico | not written yet | blocked by M3 |
| M5 | Peixes e celebrações | not written yet | blocked by M2 |
| M6 | PWA e endurecimento | not written yet | blocked by M4, M5 |

---

## M1 — Foundation

**Done when:** two real accounts exist in one group, on two real iPhones, both
installed to the home screen, landing on an empty "Hoje".

- Vite + React 19 + TS strict + Tailwind v4 + Vitest harness
- Design tokens and the flat Button primitive
- `format.ts` — pt-BR volume, date and time formatting
- `dates.ts` / `periods.ts` — `America/Sao_Paulo`, Monday weeks, period stepping
- Supabase schema migration: all tables, the `drank_on` trigger, indexes
- RLS policies, `is_group_member`, the `join_group` RPC, and the §11 checklist
- Typed Supabase client and env handling
- Email + password auth with a session provider
- Onboarding: nome → criar grupo / entrar com código
- App shell: route table, tab bar driven by that table, per-tab error boundary
- Vercel deploy, web manifest, icons, home-screen install verified
- README setup guide and CLAUDE.md conventions

**Deliberate sequencing note:** the spec's onboarding has four steps
(conta → nome → peixe → grupo). M1 ships three — the fish picker arrives with
the gallery in M5, and new profiles default to `guppy`. The end state matches the
spec exactly; this only avoids building a throwaway fish renderer in M1.

## M2 — Core loop

**Done when:** both people log water from their phones and see each other's
registers appear live, without refreshing.

**Carry-ins from M1's reviews (address while touching the relevant code):**

- `entries` Insert type requires `drank_on` even though the trigger overwrites it —
  add a DB default in an M2 migration or pass a derived value
- Entry rows must degrade gracefully when the author's profile is unreadable
  (a member who left the group)
- `ErrorBoundary` needs a route-keyed reset once multiple tabs exist
- Promote the hardcoded `#0A2A3A` ink-on-water color to a token on next touch
  (Button, TabBar plus-button)
- `Field` should link its error via `aria-invalid`/`aria-describedby`
- Login maps every auth failure to "E-mail ou senha incorretos" — distinguish
  network errors when touching that screen
- `navigator.clipboard` is assumed present in the invite-code copy button
  (fine over HTTPS; guard if contexts change)

- `bottles` CRUD and the bottle manager in Perfil
- Perfil basics: nome, cor, código do grupo, sair
- Register sheet: bottle chips with ×N, quick pills, keypad, optional
  foto/nota/hora chips, running total
- `composition.ts` — bottles × quantity + loose amount → `total_ml`
- Entry insert / edit / soft-delete with optimistic cache updates
- Hoje: scrollable member tubes, the live wave surface, gap line, register rows
  with tap-to-expand, empty state
- Photo pipeline: canvas resize to 1080px, 96px thumbnail, private bucket upload,
  signed URLs
- Storage: the private `photos` bucket plus its read/write policies on
  `storage.objects` (spec §11), and the entry-level half of the §11 RLS checklist,
  which M1 could not run because `entries` had no rows
- Realtime subscription on `entries` filtered by group

## M3 — Offline e sync

**Done when:** a register made in airplane mode survives a force-quit and syncs
on next open.

- IndexedDB outbox with FIFO ordering and op merging
- Watermark sync on `updated_at`, honouring `deleted_at`
- TanStack Query IndexedDB persister for the local mirror
- Pending dot, failed state with manual retry, backoff capped at 5 attempts
- "sem conexão" pill and the 5-minute stale-data pill
- Flush on app start, `visibilitychange`, `online`, and after each mutation

## M4 — Competição

**Done when:** all four questions are answerable — who won today, this week,
this month, ever — plus who has the better average.

- Period control with `‹ ›` stepping through days, weeks and months
- `rankings.ts` — totals per member per period, ordering, ties
- `averages.ts` — days-elapsed divisor, best day, days registered
- Standings rows with share bars and the flat first-place badge
- "Médias e recordes" comparison card
- Month wrap-up card with per-device dismissal
- Histórico: month calendar with five flat fill steps, day detail reusing the
  Hoje register row, month footer

## M5 — Peixes e celebrações

**Done when:** crossing a streak milestone unlocks a fish and celebrates exactly
once.

- `catalog.ts` — the 13 fish with unlock conditions
- 13 flat SVG fish behind `<Fish variant level state size />`
- `unlocks.ts` — derived unlock set, never stored
- `streaks.ts` — consecutive days, today-not-yet-logged, backdated repair
- Fish gallery in Perfil with locked silhouettes and conditions
- Celebration engine: priority ordering, one full screen per register, toasts
- GSAP timelines; `prefers-reduced-motion` fallbacks
- Fish picker added to onboarding

## M6 — PWA e endurecimento

**Done when:** installed, offline-capable, and the RLS checklist passes clean.

- `vite-plugin-pwa` precache of the app shell, Supabase never SW-cached
- Update prompt: "Nova versão disponível — atualizar"
- Version and build date in Perfil
- Playwright smoke: login → registrar 500 ml → Hoje → Ranking → reload
- Re-run the §11 RLS checklist against production
- Performance pass against the §1 success criteria
