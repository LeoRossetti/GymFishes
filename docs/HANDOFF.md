# GymFishes — Agent Handoff

**Written:** 2026-09-01, at the end of the M1 build session. **Refreshed:** 2026-10-19.
**Audience:** the next AI agent (or human) continuing this project.

## What this project is

A water-intake competition PWA for exactly two people (Leo and his girlfriend), in
pt-BR, GymRats-style: register water through the day, compare daily/weekly/monthly/
all-time rankings, unlock fish mascots via streaks and records. Mobile-only, dark
theme only, installed to iPhone home screens. Simplicity is a stated product feature.

## Where truth lives (read in this order)

1. `docs/superpowers/specs/2026-08-11-gymfishes-design.md` — **the binding spec.**
   Every product and architecture decision, including security decisions recorded
   mid-build (§3 accepted-risk note, §11 RLS matrix). If code and spec disagree, the
   spec wins; if you must deviate, update the spec in the same change.
2. `docs/superpowers/plans/ROADMAP.md` — milestone backlog (M1–M9) with each milestone's
   status and its pending owner verifications.
3. `CLAUDE.md` at the repo root — **on disk but git-ignored** (owner wants Claude
   tooling out of the repo). It holds the working conventions: pt-BR strings only via
   `src/lib/strings.ts`, date math only in `src/lib/dates.ts`/`periods.ts`, tokens-only
   colors, testing rules, and the database workflow. It loads automatically for Claude
   Code; other agents should read it manually.
4. `docs/superpowers/plans/2026-08-11-m1-foundation.md` — the executed M1 plan.
   Historical record. Note: a few code blocks in it are stale versus the repo
   (AuthProvider, auth-form details, tab strings) — reviews changed the code after
   the plan was written. The repo is the truth for code.

## Current state (verified at the 2026-10-19 refresh)

- **All nine milestones (M1–M9) are code-complete**, version 1.3.0. 492 tests, typecheck
  and build clean.
- `development` is merged to `main` through PR #8
  (https://github.com/LeoRossetti/GymFishes/pull/8).
- Each milestone's pending owner verifications (real-phone checks, the RLS checklist) are
  listed in the status column of `docs/superpowers/plans/ROADMAP.md`.

## Environment — things that will bite you if you don't know them

- **Cloud-only Supabase, no Docker.** Project ref `jqhzqkfqifkhxzthbolb` (sa-east-1),
  already linked (`supabase/.temp`). Docker is NOT installed on this machine:
  `supabase start`, `db reset` and `db dump` will not work. Use:
  - apply migrations: `export SUPABASE_DB_PASSWORD="$(grep '^supabase_password=' .env.local | cut -d= -f2-)" && npx supabase db push` (Git Bash)
  - regenerate types: `npx supabase gen types typescript --project-id jqhzqkfqifkhxzthbolb > src/lib/database.types.ts`
  - inspect remote schema: `npx supabase db query --linked "<sql>"`
- **`.env.local` holds live credentials** (`supabase_password`, VITE url/anon key).
  NEVER print it, NEVER commit it, NEVER run `cp .env.example .env.local` (it would
  destroy the real credentials). The README contains that cp line for fresh clones —
  do not "verify" it by running it here.
- **The cloud database is the only database.** There is no sandbox. Migrations are
  never edited after being applied — always create a new one
  (`npx supabase migration new <name>`). Four are applied: schema, rls, rls_hardening,
  m2_defaults_photos_realtime.
- **Cloud auth setting:** email confirmations are OFF (there is no confirmation UI).
- **Windows machine, Git Bash for POSIX commands.**
- Node 24 / npm 11. Commands: `npm run dev` / `test` (watch) / `test:run` /
  `typecheck` / `build`.

## Security model (do not weaken casually)

RLS is the app's ONLY authorization boundary — the client talks straight to Postgres
with the anon key. The policy set survived an adversarial review; notable invariants:
`entries_update` pins BOTH author and group membership; entries have NO delete policy
(soft delete via `deleted_at` only); bottles are strictly private; joining a group goes
only through the `join_group` RPC; all `security definer` functions pin
`search_path = public, pg_temp`. The §11 behavioral checklist items that need `entries`
rows are still pending — run them once M2 creates real entries. Accepted risk on
record: no member eviction, permanent invite codes (spec §3).

## Owner preferences (learned this project — respect them)

- **Never overcomplicate anything.** He will strip features you add unrequested. The
  leanest option wins; say when you chose it.
- **Pacing:** work in coherent chunks, pause at natural topic boundaries, never stop
  mid-topic. Offer the pause; don't marathon.
- **README style:** simple non-technical pt-BR, emoji icons, images welcome. The plush
  fish mascot is named **Fih** (owner named him) — hero of the README.
- Design feedback from his first use of the deployed app: the current look reads
  generic (system font especially, on Windows) and the one-tab bar makes the inert "+"
  look broken. Both acknowledged as debts to fix during M2's visual work — consider a
  rounded display font (e.g. Nunito) for the Duolingo feel he wants, and pad or center
  the tab bar until more tabs exist.

## Next work

None planned. The one open item is rerunning `npm run e2e` after the Supabase reset; the
owner's pending verifications are in the status column of ROADMAP.md.

Process used so far (owner is happy with it): brainstorm → write the detailed
per-milestone plan immediately before executing it (against the real codebase) →
execute task-by-task with fresh implementer subagents and a reviewer per task →
final whole-branch review. TDD for pure logic; never commit with a failing test.
