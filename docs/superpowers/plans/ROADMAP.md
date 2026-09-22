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
| M2 | Core loop — registrar e ver água | [`2026-09-01-m2-core-loop.md`](2026-09-01-m2-core-loop.md) | **code-complete** — pending owner verifications: two-browser realtime check, one register from a real phone |
| M3 | Offline e sync | [`2026-09-06-m3-offline-sync.md`](2026-09-06-m3-offline-sync.md) | **code-complete** — pending owner verification: airplane-mode register survives a force-quit on a real iPhone |
| M4 | Competição — Ranking e Histórico | [`2026-09-07-m4-competicao.md`](2026-09-07-m4-competicao.md) | **code-complete** — pending owner verification: step back one week on a real phone and sanity-check the standings; edit a past register from Histórico |
| M5 | Peixes e celebrações | [`2026-09-08-m5-peixes-celebracoes.md`](2026-09-08-m5-peixes-celebracoes.md) | **code-complete** — pending owner verification: both fish on both phones; a round litre, an overtake, and the first real 7-day streak celebrating once; open Perfil › Trocar peixe and judge the 13 shapes (nudge `svg/<id>.ts` paths if any reads badly, keeping the five layers) |
| M5.5 | Polimento de UX | [`2026-09-17-m5-polish.md`](2026-09-17-m5-polish.md) | **code-complete** — pending owner verification: swipe the sheet handle and scroll a tall sheet on a real phone; tap every control and feel the press state; VoiceOver on Histórico and on a celebration |
| M6 | PWA e endurecimento | [`2026-09-22-m6-pwa-endurecimento.md`](2026-09-22-m6-pwa-endurecimento.md) | **code-complete** — pending owner verification: deploy, open the installed app on both phones and see the update bar appear after the next deploy; airplane mode → the app opens to yesterday's data; Perfil › Sobre shows the new version |

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
  `storage.objects` (spec §11)
- Realtime subscription on `entries` filtered by group

**Deliberate sequencing note:** the spec's Hoje shows the member's fish riding the wave
and a streak chip on the registers card. M2 ships a 🐟 emoji placeholder (the 13 SVG fish
are M5) and no streak chip (`streaks.ts` is M5). Photo uploads happen before the entry
write, directly — the durable outbox that makes this crash-safe is M3. End state still
matches the spec.

**§11 RLS checklist:** the entry-level half M1 could not run (no `entries` rows existed yet)
was run programmatically on 2026-09-01 via `curl` against the REST/Auth/Storage APIs with two
throwaway accounts in a throwaway group, cross-checked against the real group read-only —
all 7 negative checks and all positive controls passed. Evidence:
[`../2026-09-01-rls-checklist-evidence.md`](../2026-09-01-rls-checklist-evidence.md).

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

**Deliberate sequencing note:** the spec's standings row shows the member's fish; M4 ships the
same 🐟 emoji placeholder as Hoje (the 13 SVG fish are M5). No streak chip anywhere yet
(`streaks.ts` is M5). Calls the spec left open — forward arrow disabled at the current period,
"Hoje"/"Ontem" day labels, shared positions on ties, the wrap-up showing all month until
dismissed, one comparison column per member, opacity steps for the calendar fills — are
recorded in the plan and folded into spec §5.3/§5.4.

## M5 — Peixes e celebrações

**Done when:** crossing a streak milestone unlocks a fish and celebrates exactly
once.

- `catalog.ts` — the 13 fish with unlock conditions
- 13 flat SVG fish behind `<Fish variant state size />`
- `unlocks.ts` — derived unlock set, never stored
- `streaks.ts` — consecutive days, today-not-yet-logged, backdated repair
- Fish gallery in Perfil with locked silhouettes and conditions
- Celebration engine: priority ordering, one full screen per register, toasts
- `motion` sequences and CSS keyframes; `prefers-reduced-motion` fallbacks
- Fish picker added to onboarding

**Deliberate sequencing note:** no GSAP — the fish idle loop is CSS keyframes (like the water)
and celebration choreography is `motion`, which already ships; the spec's decision log now says
so. `<Fish>` dropped the `level` prop (the tube positions it). Calls the spec left open — all-time
unlock facts, completed-months-only wins, inserts-only celebrations with a self-seeding
`seen_unlocks`, "lead" meaning an overtake, the unlock screen waiting for a button, joined toasts,
the litre caption on the gap line, a hidden 0-day chip, tap-to-save in onboarding, an in-place
gallery — are recorded in the plan and folded into spec §3/§5/§6/§7/§8. Accepted edge: a
brand-new device that registers before its first sync completes seeds `seen_unlocks` from an
empty mirror and will celebrate already-earned fish at the following register.

## M5.5 — Polimento de UX

- Task 1 — Accessibility: contrast scoping, targets, focus, disabled state, screen-reader parity
- Task 2 — Visual polish: press feedback, fish tones, disclosure, hierarchy
- Task 3 — Copy and small behaviours: honest labels, feedback, recovery
- Task 4 — The register sheet and dialogs: gesture conflict, modal semantics, announced celebrations
- Task 5 — Docs: spec alignment and roadmap

Re-examined 2026-09-17 and standing as designed: no password reset (§3), at-risk chip
opacity (§4), no group exit (§3), the streak mechanic (§2). Rejected as mechanisms: a
dismiss confirmation, remembering the Ranking period across tabs, an unarchive view, a
keypad cap signal.

## M6 — PWA e endurecimento

**Done when:** installed, offline-capable, and the RLS checklist passes clean.

- Task 1 — Version, build date and Perfil › Sobre; the app version doubles as the
  TanStack persister `buster`
- Task 2 — `vite-plugin-pwa` precache of the app shell in prompt mode, Supabase never
  SW-cached; latin-only Nunito subsets; the `useAppUpdate()` hook
- Task 3 — The update bar: "Nova versão disponível" / "Atualizar", living in `AppShell`
- Task 4 — Paged read sync in 1000-row windows; the first-ever sync skips soft-deleted rows
- Task 5 — Playwright smoke: login → registrar 500 ml → Hoje → Ranking → reload → limpar,
  against the production build and the cloud project with a throwaway account
- Task 6 — Vendor chunk split for precache stability; Lighthouse pass against §1 criterion 4
- Task 7 — Re-run of the §11 RLS checklist against the live project, now with real entries
  and photos
- Task 8 — Docs: spec alignment, roadmap, README

Calls made here: version 1.0.0 doubles as the persister buster; the update bar has no
dismiss, never auto-reloads, and lives in the shell (which reserves its space — the login
screen shows none); one vendor chunk is split off so a deploy re-downloads only app code
(~27 kB gzip instead of ~206 kB), screens are not lazy-loaded; the first sync skips
soft-deleted rows and all reads are paged in 1000-row windows. Measured (see
[`../2026-09-22-m6-performance.md`](../2026-09-22-m6-performance.md)): precached cold start
LCP and interactive 1.1 s — §1 criterion 4 met; uncached first load LCP 2.5 s, over the
mark, and not the path the criterion names. The smoke exposed and M6 fixed a real bug: the
route guard read a pending bootstrap as finished, so a reload on any tab bounced through
onboarding to Hoje. RLS re-run 2026-09-22: 7/7 negative checks pass, admin-verified —
[`../2026-09-22-rls-checklist-evidence.md`](../2026-09-22-rls-checklist-evidence.md). The
e2e account lives in a throwaway group and doubled as account E of that run.
