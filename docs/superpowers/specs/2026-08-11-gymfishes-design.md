# GymFishes — Design Spec

**Data:** 2026-08-11
**Status:** aprovado para planejamento
**Autor:** Leonardo Rossetti Francatto (com Claude)

Aplicativo de registro de ingestão de água para duas pessoas, com competição no estilo
GymRats. PWA mobile-only, interface em português (pt-BR).

> Este documento é a fonte única de verdade do produto e da arquitetura. A UI é em
> pt-BR; a documentação técnica é em inglês para facilitar a implementação. Strings de
> interface aparecem entre aspas exatamente como devem ser exibidas.

---

## Índice

1. [Goals and non-goals](#1-goals-and-non-goals)
2. [Decision log](#2-decision-log)
3. [Users, groups and auth](#3-users-groups-and-auth)
4. [Time rules](#4-time-rules)
5. [Screens](#5-screens)
6. [Fish catalog and unlocks](#6-fish-catalog-and-unlocks)
7. [Celebrations](#7-celebrations)
8. [Design system](#8-design-system)
9. [Architecture](#9-architecture)
10. [Data model](#10-data-model)
11. [Security (RLS)](#11-security-rls)
12. [Sync, offline and the outbox](#12-sync-offline-and-the-outbox)
13. [Photos pipeline](#13-photos-pipeline)
14. [Error handling](#14-error-handling)
15. [Testing strategy](#15-testing-strategy)
16. [Project structure](#16-project-structure)
17. [Out of scope for v1](#17-out-of-scope-for-v1)
18. [Future upgrades](#18-future-upgrades)

---

## 1. Goals and non-goals

### Goals

- Register water intake in **two taps** from app open, many times per day.
- See the other person's progress **live**, without refreshing.
- Answer, cleanly and separately: *who drank more today / this week / this month / ever*,
  and *who has the better daily average*.
- Feel good to use: flat, sharp, dark, water-themed, with earned celebration moments.
- Cost **R$ 0/month** to run.

### Non-goals

- Anti-cheat, validation, or proof of any kind. Two people who trust each other.
- Desktop or tablet layouts. The app is mobile-only; on a wide screen it renders as a
  centered phone-width column.
- Health advice, hydration targets, or medical framing.
- Any server-side code. The app is a static bundle plus a managed backend.

### Success criteria

1. A register with a known bottle takes ≤ 2 taps and ≤ 3 seconds.
2. A register made by one person appears on the other's device in < 2 seconds while both
   are open.
3. A register made with no connectivity is never lost, and syncs on next app open.
4. Cold start to interactive on 4G, installed to home screen: < 2 seconds.
5. Both people still use it daily after one month.

---

## 2. Decision log

Every decision below was explicitly settled during design. Recorded so we don't relitigate.

| Topic | Decision | Rationale |
|---|---|---|
| Platform | PWA installed to iOS home screen | Avoids Apple developer fees; iOS 26 treats home-screen sites as web apps by default |
| App shell | Vite SPA (React 19 + TS) | No SSR needed behind auth; cleanest offline/PWA story; no server runtime |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) | Free tier far exceeds our needs; SQL makes ranking trivial; portable Postgres |
| Auth | Email + password | Magic links and OAuth redirects break out of the installed PWA on iOS |
| Photos | Optional per register | Most registers are quick 200 ml logs; forcing a photo would kill the fast path |
| Ranking metric | Raw volume (ml) | Explicitly chosen over % of goal |
| Daily goals | **None** | Removed entirely; celebrations are driven by records and streaks instead |
| Ranking periods | Calendar: Hoje / Semana / Mês / Total | A month that *ends* produces a real winner |
| Week start | Monday–Sunday (ISO) | Reads as a challenge week; weekend sits at the end |
| Timezone | Fixed `America/Sao_Paulo`, day boundary at local midnight | Both users in one timezone; no per-user tz config |
| Backdating | Free — any date and time | Covers forgotten morning glasses and 00:30 water |
| Reactions/comments | **None** | Read-only feed; comments feel dead without notifications |
| Push notifications | **Not in v1** | Requires a server piece; revisit once the app is a daily habit |
| Offline writes | Durable outbox in IndexedDB, flushed on open/focus/online | iOS has no Background Sync API |
| Bottles | Personal per user, not shared | Chosen over a shared household list |
| Members | 2 today, group-based schema, horizontally scrollable columns | A third person is a row, not a migration |
| Navigation | 4 tabs + center "+" | Each tab answers exactly one question |
| Register list | Compact rows with small thumbnail, tap to expand | Most registers have no photo; big cards would leave an uneven feed |
| Register input | Bottle chips + quick pills + numeric keypad | Fastest path; a draggable dial fights you at exactly 250 ml |
| Theme | **Dark only**, deep-sea | Chosen over light-only or both |
| Visual tone | Flat solid fills, 1px borders, solid bottom edge on buttons | Duolingo-like; no gradients, no glow |
| Water surface | Continuously drifting sine waves, paused when hidden | The signature of a water app; it's shape rather than light, so it stays inside the no-glow rule |
| Fish art | SVG components animated with GSAP | Rive's advantage is invisible at 20px and its WASM runtime outweighs the art |
| Rive | Optional future upgrade for **one** large moment | ~$9/mo for `.riv` export, plus a learning and illustration project |
| Component base | shadcn/ui | React Bits Pro ships via the shadcn registry protocol |
| i18n | None — pt-BR strings in one module | Single locale forever |
| Overriding constraint | **Never overcomplicate anything** | Simplicity is a product feature, not a tradeoff |

---

## 3. Users, groups and auth

### Accounts

Email + password via Supabase Auth. Sessions persist in `localStorage` and refresh
automatically, so in practice you log in once per device and never again.

There is no password-reset UI in v1. If needed, it is done from the Supabase dashboard.
Documented deliberately: building a reset flow for two people who own the project is the
kind of machinery we're avoiding.

### Onboarding (first run)

Four steps, one screen each, no skipping:

1. **Conta** — "Criar conta" / "Entrar" (email + senha).
2. **Nome** — "Como você quer aparecer?" (display name, 2–20 chars).
3. **Peixe** — pick one of the four starter fish. "Escolha seu peixe".
4. **Grupo** — either:
   - "Criar grupo" → group name, generates a 6-character invite code, shows it with a
     copy/share button; or
   - "Entrar com código" → enters a code.

After onboarding, a user belongs to exactly one group. The schema permits many; the UI
assumes one. If a user somehow has several, the first by `joined_at` is used.

### Invite codes

Six characters from the unambiguous alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no
`I`, `O`, `0`, `1`). Generated client-side; the unique constraint plus a retry loop
handles collisions. Codes do not expire and are not single-use — the group owner can see
and re-share the code from **Perfil** at any time.

**Accepted risk, decided deliberately (security review 2026-08-25):** a leaked code lets
anyone join, there is no member-eviction mechanism in v1, and leaving is voluntary. The
creator can rotate the invite code to stop *new* joins, but cannot remove someone already
inside. For a two-person household app this is fine; if a third member ever becomes a real
feature, an eviction policy (creator-may-delete-members) must ship with it.

Joining someone else's group happens through a `join_group(code)` RPC, because RLS must
not let a user insert themselves into an arbitrary group. See
[Security](#11-security-rls).

---

## 4. Time rules

A single module (`lib/dates.ts`) owns every one of these. No date math anywhere else.

- **Timezone:** `America/Sao_Paulo`, hardcoded as `APP_TZ`.
- **Day:** local midnight to local midnight. A register at 00:30 belongs to the new day;
  backdating exists precisely so late-night water can be moved if you disagree.
- **Week:** Monday 00:00 through Sunday 23:59:59.
- **Month:** calendar month.
- **Total:** everything since the first register in the group.
- **Streak:** the number of consecutive days, counting backwards, on which *you* have at
  least one register.
  - If you have registered today, today counts and the streak includes it.
  - If you have not registered today yet, the streak shows the value as of **yesterday**
    and is displayed as at risk (yellow chip, "🔥 12 dias" with reduced opacity). It
    breaks only once yesterday also has no register.
  - Because the streak is derived from stored registers, backdating retroactively repairs
    it. That is intended.

---

## 5. Screens

Five destinations: four tabs plus a modal register sheet. Perfil is the fourth tab; the
center "+" is not a tab but a button.

```
┌─────────────────────────────────────────────┐
│  Hoje   Ranking   ( + )   Histórico  Perfil │
└─────────────────────────────────────────────┘
```

### 5.1 Hoje

The default screen. Answers *how are we doing right now*.

**Header** — "Hoje", the date in full pt-BR ("segunda, 10 de agosto"), and your fish
avatar on the right (tap → Perfil).

**Progress card** — a horizontally scrollable strip of member columns. Each column is a
tube: flat dark base, 2px border, and a flat blue fill whose height is that member's total
for today. The top of the fill is a **live wave surface**, not a straight edge — see
[Water surface](#water-surface). The member's fish rides at that surface. Below the tube:
the total ("1,8 L") and the name ("VOCÊ", "ELA").

The tube's full height is scaled to `max(3000, highestTotalToday)` ml, so the columns stay
comparable and nobody's ever pinned at 100%. Since there are no goals, the scale is
relative, not a target.

Under the strip: the gap line — "Ela está 500 ml na frente" / "Você está 500 ml na frente"
/ "Empate técnico" — in flat blue.

**Registers card** — "Registros de hoje · 4" with the streak chip on the right. Then the
day's registers from **both** members, newest first, as compact rows:

`[thumb 42px] [name · time / note or composition] [total, right-aligned, blue]`

- Registers with a photo show the 96px thumbnail; those without show a 💧 tile, so the
  rhythm never breaks.
- Tapping a row expands it in place: full photo, full note, composition chips
  ("1 × Garrafa azul 1,5 L", "+ 300 ml"), the resolved total, and — only on **your own**
  registers — "Editar" and "Excluir".
- A register still in the outbox shows a small dot next to the time and is not editable
  until it syncs.

**Empty state** — "Nenhum registro hoje. Bora beber água. 💧"

### 5.2 Registrar (modal sheet)

Opened by the center "+". A bottom sheet, dismissible by swipe-down or backdrop tap.
Everything on one screen — no steps, no wizard.

**Running total** — large, centered ("1,8 L"), with the composition beneath it in small
muted text ("1 × Garrafa azul + 300 ml"). Counts up when it changes.

**"Minhas garrafas"** — a 2-column grid of your bottles, each showing emoji, name and
volume. Tapping adds one; tapping again increments to `×2`, `×3`. A badge shows the
count; tapping the badge decrements by one. Last cell is a dashed "+ nova garrafa"
which opens an inline mini-form (name, volume, optional emoji).

**"Valor avulso"** — four quick pills (`+100`, `+200`, `+250`, `+500`) and a numeric
keypad (digits, `00`, `⌫`). There is exactly one loose amount per register, added to
whatever the bottles contribute. The pills **add** to it; the keypad **replaces** it.

**Optional chips** — three dashed chips that turn solid green once set:
- "📷 foto" → opens `<input type="file" accept="image/*">`, which on iOS offers camera or
  library. Once chosen, shows a thumbnail and an ✕ to remove.
- "📝 nota" → expands a 140-character text field.
- "🕐 agora" → expands a date + time picker, defaulting to now. Label becomes the chosen
  moment once changed.

**CTA** — a full-width button, "REGISTRAR 1,8 L", disabled while the total is zero.

Saving is **optimistic**: the sheet closes immediately, the register appears in Hoje, the
water rises, and the outbox handles delivery. The user never waits on the network.

**Editing** reuses this exact sheet, pre-filled, with the CTA reading "SALVAR ALTERAÇÕES".

### 5.3 Ranking

Answers *who is winning*. Nothing else lives here.

**Period control** — a segmented control: `Hoje | Semana | Mês | Total`, with `‹ ›`
arrows to step backwards and forwards through periods (previous day, previous week,
previous month). `Total` has no arrows. The current period label sits between the arrows
("Semana de 4–10 de agosto", "Julho", "Desde 12 de junho").

Stepping into a past period is how you answer *"quem bebeu mais na semana passada?"*.

**Standings** — one row per member, ordered by volume descending:

`[position] [fish] [name] [·············· bar ··············] [total]`

The bar shows each member's share of the period leader's total. First place is marked with
a flat first-place treatment (yellow position badge); no crowns, no glow. A period with no
registers shows "Nada registrado neste período".

**"Médias e recordes"** — a comparison card, one column per member:

| | Você | Ela |
|---|---|---|
| Média por dia | 2,4 L | 2,9 L |
| Melhor dia | 4,2 L (7 ago) | 3,8 L (2 ago) |
| Dias registrados | 9 de 10 | 10 de 10 |
| Registros | 41 | 58 |

"Média por dia" divides by *days elapsed in the period*, not days registered — so skipping
a day genuinely costs you. For `Total`, days elapsed counts from the group's first
register. This is the figure that answers *"quem tem a maior média?"*.

**Month wrap-up** — on the first open of a new month, if the previous month has registers,
a dismissible card appears at the top of Ranking:

> **Julho encerrado** — Ela venceu 🏆
> 68,4 L × 61,2 L

Dismissal is stored per device in `localStorage`. Deliberately not synced; re-showing it
once on a second device is harmless.

### 5.4 Histórico

Answers *what happened before*.

**Member toggle** — two small tabs, "Você" / "Ela", switching whose history is shown.

**Calendar** — a month grid with `‹ ›` month arrows. Each day cell is filled with one of
five discrete flat blue steps based on that day's total (0, <1L, 1–2L, 2–3L, >3L). Flat
steps, not a continuous gradient. Today gets a border. Days before the group's first
register are blank.

**Day detail** — tapping a day expands a panel below the calendar showing both members'
totals for that day and the full register list, reusing the same compact-row component
from Hoje (including tap-to-expand and, for your own registers, edit/delete).

**Month footer** — "Agosto: 61,2 L · média 2,4 L/dia · 22 de 25 dias".

### 5.5 Perfil

Settings and identity. Nothing competitive lives here.

- **Seu peixe** — your current fish, large. Tapping opens the fish gallery: a grid of all
  fish, unlocked ones in full colour and tappable, locked ones as a flat silhouette with
  the unlock condition below ("Sequência de 30 dias"). Selecting one saves immediately and
  the partner sees the change.
- **Nome** — inline editable.
- **Cor** — a row of six flat accent swatches used for your column and avatar ring.
- **Minhas garrafas** — list with volume; add, rename, change volume, or archive.
  Archiving hides a bottle from the register sheet but never rewrites history, because
  every register stores a snapshot of the bottle's name and volume at the time.
- **Grupo** — group name, members, and the invite code with a copy button.
- **Sair** — sign out, with a confirm.
- **Sobre** — app version and build date. Useful when debugging a stale service worker.

---

## 6. Fish catalog and unlocks

Thirteen fish: four starters plus nine unlockable. Unlock conditions cover exactly the
four triggers approved during design — streak, accumulated volume, monthly wins, and
personal record.

| Fish | pt-BR | Unlock |
|---|---|---|
| Guppy | Guppy | inicial |
| Betta | Betta | inicial |
| Goldfish | Peixe-dourado | inicial |
| Neon tetra | Neon | inicial |
| Pufferfish | Baiacu | sequência de 7 dias |
| Clownfish | Peixe-palhaço | sequência de 30 dias |
| Angelfish | Peixe-anjo | sequência de 100 dias |
| Octopus | Polvo | um dia acima de 5 L |
| Seahorse | Cavalo-marinho | 100 L acumulados |
| Turtle | Tartaruga | 500 L acumulados |
| Dolphin | Golfinho | 1.000 L acumulados |
| Shark | Tubarão | ganhar 1 mês |
| Whale | Baleia | ganhar 3 meses |

### How unlocks work

Unlocked status is **derived**, never stored. A pure function takes your synced registers
plus the group's monthly results and returns the set of unlocked ids:

```ts
unlockedFish(entries: Entry[], monthlyWins: number): Set<FishId>
```

This means no extra table, no writes, no drift, and it self-heals if data changes. The only
stored value is `profiles.fish_variant` — your current choice — because the other person
has to see it.

"Newly unlocked, not yet celebrated" is tracked per device in `localStorage`
(`seen_unlocks`). On a fresh device you may miss a past unlock celebration; the fish is
still unlocked. Acceptable.

### Art

Each fish is a small React component rendering flat SVG using two or three palette
colours, drawn on a shared silhouette structure so the set reads as one family. The public
interface is deliberately narrow so any single fish can later be swapped for a Rive file
without touching callers:

```tsx
<Fish variant="betta" level={0.62} state="idle" size={20} />
```

GSAP drives a slow tail rotation and vertical bob at rest, and a quick dart upward when a
register lands. `prefers-reduced-motion` disables both.

---

## 7. Celebrations

All celebrations are evaluated by one pure function after a register is committed locally,
comparing the state before and after:

```ts
celebrationsFor(before: DayState, after: DayState): Celebration[]
```

| Trigger | Presentation | Text |
|---|---|---|
| New fish unlocked | Full screen | "Novo peixe! 🐡" + reveal + "Escolher agora" / "Depois" |
| New personal best day | Full screen | "Novo recorde! 4,2 L" |
| Streak milestone (7/30/100) | Full screen | "🔥 30 dias seguidos!" |
| Took the lead today | Toast | "Você assumiu a liderança 🏆" |
| Round litre crossed (1L, 2L, 3L…) | Inline | water surge + count-up + "2 L hoje" |

**Rules that keep it from becoming noise:**

- At most **one** full-screen celebration per register. Priority is the table order:
  unlock > record > streak > lead > round litre.
- Anything outranked degrades to a toast, or is dropped if it was already inline.
- Full-screen celebrations dismiss on tap and auto-dismiss after 4 seconds.
- The personal-best celebration requires a previous best to beat, so day one is not a
  record.
- Nothing fires for registers that arrive via realtime from the other person. You only
  celebrate your own water.
- `prefers-reduced-motion` replaces every animation with a crossfade.

Implementation is a GSAP timeline per celebration type, over flat shapes — bubbles rising,
the fish leaping, the number counting. No particles, no bloom.

---

## 8. Design system

### Tokens

Defined once as CSS custom properties on `:root` in `styles/tokens.css`, consumed through
Tailwind v4's `@theme`. Dark only — there is no light palette to maintain.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#131F24` | page background |
| `--surface` | `#1F2C34` | cards, sheets |
| `--surface-2` | `#25353E` | chips, keypad keys, inputs |
| `--line` | `#37464F` | all 1px borders |
| `--ink` | `#F1F7FB` | primary text |
| `--ink-2` | `#93AEBF` | secondary text |
| `--ink-3` | `#6C838F` | labels, disabled |
| `--water` | `#1CB0F6` | water, primary action, totals |
| `--water-edge` | `#1899D6` | button bottom edge |
| `--water-hi` | `#4FC3F9` | wave crest / surface highlight |
| `--ok` | `#58CC02` | confirmation, set-state chips |
| `--streak` | `#FFC800` | streak chip, first place |
| `--danger` | `#FF4B4B` | delete |

Six accent swatches for member colours are picked to stay legible on `--bg` and to remain
distinguishable from each other in the tubes.

### Rules

- **Flat only.** No gradients, no glow, no drop shadows on surfaces. Depth comes from a
  1px `--line` border and, on primary buttons, a 3–4px solid `--water-edge` bottom edge.
- **One accent at a time.** Beyond blue, only green (confirm), yellow (streak/first) and
  red (delete) exist. If a screen needs a fourth, the screen is wrong.
- **Numbers carry the emphasis.** Totals are the largest, heaviest text on any screen.
- **Radius:** 16px cards and sheets, 12px controls, 10px keypad keys, 99px pills.
- **Spacing:** 4px scale; 13px screen gutter; 11px between cards.
- **Type:** system stack (`-apple-system, "Segoe UI", system-ui, sans-serif`) — native
  feel, zero bytes. Scale: 38 / 24 / 20 / 17 / 15 / 13 / 11 / 9. Weights 500 / 700 / 800.
  Tight tracking (`-0.4px` and below) on large numbers only.
- **Labels** are 9px, uppercase, `letter-spacing: 1px`, `--ink-3`, weight 800.
- **Touch targets** never below 44px.
- **Safe areas:** `env(safe-area-inset-*)` on the tab bar and sheets.

### Motion

| Class | Duration | Easing |
|---|---|---|
| State/toggle | 150 ms | ease-out |
| Sheet in/out | 280 ms | spring, low bounce |
| Water level change | 600 ms | spring |
| Number count-up | 500 ms | ease-out |
| Water surface wave | continuous loop | linear, see below |
| Celebration timeline | 900–1400 ms | GSAP timeline |

`motion` handles component and layout transitions; GSAP handles choreographed celebration
sequences and the fish. `prefers-reduced-motion` collapses everything to a 120ms crossfade.

### Water surface

The water's top edge is never a straight line. Two SVG sine paths sit inside the tube's
clip region and drift horizontally at different speeds, so the crest never visibly repeats:

| | Back crest | Front crest |
|---|---|---|
| Amplitude | 3 px | 2 px |
| Period | 1.4 × tube width | 1.0 × tube width |
| Drift | 7 s per cycle | 4.5 s per cycle, opposite direction |
| Fill | `--water-hi` | `--water` |

Both are CSS `translateX` keyframe loops — GPU-composited, with no per-frame JavaScript.
The animation pauses when the document is hidden (`visibilitychange`) and when the tube
scrolls out of view (`IntersectionObserver`), so an idle app costs nothing.

This is **shape, not light**: flat fills and a wavy edge, no gradients and no glow.

When a register lands, the level springs to its new height over 600 ms while the wave
amplitude briefly doubles and settles back over ~900 ms, so new water reads as a splash
rather than a rectangle getting taller. The fish is displaced upward by the same spring.

Under `prefers-reduced-motion` the wave is replaced by a static 3px `--water-hi` band and
the level change becomes a 120 ms crossfade.

---

## 9. Architecture

```
  iPhone — PWA installed to home screen
  ┌───────────────────────────────────────────────┐
  │  React 19 + TypeScript + Tailwind v4          │
  │  shadcn/ui  ·  motion  ·  GSAP                │
  │                                               │
  │  TanStack Query ── persisted ──┐              │
  │      │                          ▼             │
  │      │                   IndexedDB            │
  │      │                    · query cache       │
  │      │                    · outbox (writes)   │
  │      │                    · pending photos    │
  │      ▼                                        │
  │  selectors: rankings, streaks, unlocks        │
  │  (pure functions over the local mirror)       │
  └───────────────────────────────────────────────┘
        │  REST (writes, sync)   │  WebSocket (realtime)
        ▼                        ▼
  ┌───────────────────────────────────────────────┐
  │  SUPABASE (free tier)                         │
  │   Auth — email + password                     │
  │   Postgres — profiles, groups, bottles,        │
  │              entries  (+ RLS)                 │
  │   Realtime — entries changes for my group     │
  │   Storage — photos + thumbs (private bucket)  │
  └───────────────────────────────────────────────┘

  Hosting: Vercel, static output. No server runtime.
```

### Local-first, and why

The entire dataset is small — two people at roughly eight registers a day is about 6,000
rows a year, well under 1 MB of JSON. So the client keeps a **full mirror** and computes
every ranking, average, streak and unlock locally as pure functions.

This one decision buys a lot:

- Switching between Hoje / Semana / Mês / Total is instant, with no queries.
- Every ranking works offline.
- Realtime becomes trivial: an incoming row is appended to the mirror and every derived
  view recomputes.
- No SQL views, no RPC aggregations, no cache invalidation logic.

If the dataset ever outgrows this — years away, and only if more people join — the escape
hatch is a Postgres view plus a windowed query, without changing the UI.

### Stack

| Concern | Choice |
|---|---|
| Build | Vite 6 |
| Language | TypeScript, `strict` |
| UI | React 19 |
| Styling | Tailwind v4 + CSS custom properties |
| Components | shadcn/ui (also the React Bits Pro registry target) |
| Routing | React Router (4 tab routes + modal route for the sheet) |
| Server state | TanStack Query + IndexedDB persister |
| Local writes | `idb-keyval` for the outbox |
| Animation | `motion` (UI) + GSAP (celebrations, fish) |
| PWA | `vite-plugin-pwa` (Workbox) |
| Backend | `@supabase/supabase-js` |
| Tests | Vitest + React Testing Library; Playwright smoke |
| Hosting | Vercel (static) |

### PWA specifics

- `display: standalone`, `orientation: portrait`, `theme_color: #131F24`,
  `background_color: #131F24`, maskable icons at 192/512.
- Service worker precaches the app shell. Supabase requests are **never** cached by the
  service worker — TanStack Query's persisted cache is the only read cache, so there is
  one source of staleness instead of two.
- iOS caps Cache API storage at roughly 50 MB per partition and may evict after disuse.
  The shell is a few hundred KB, so this is only a concern for pending photo uploads,
  which is why photos are compressed to ~200 KB before they ever enter the outbox.
- No Background Sync API on iOS. The outbox flushes on app start, `visibilitychange` to
  visible, the `online` event, and after each successful mutation. Never in the background.
- A version string is displayed in Perfil and an update prompt appears when the service
  worker finds a new build ("Nova versão disponível — atualizar").

---

## 10. Data model

```sql
-- ─── profiles ──────────────────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 20),
  fish_variant  text not null default 'guppy',
  accent        text not null default 'blue',
  created_at    timestamptz not null default now()
);

-- ─── groups ────────────────────────────────────────────────────────────
create table groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 40),
  invite_code  text not null unique check (invite_code ~ '^[A-Z2-9]{6}$'),
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now()
);

create table group_members (
  group_id    uuid not null references groups(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- ─── bottles (personal) ────────────────────────────────────────────────
create table bottles (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 30),
  volume_ml    int  not null check (volume_ml between 1 and 10000),
  emoji        text,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── entries ───────────────────────────────────────────────────────────
create table entries (
  id           uuid primary key,          -- client-generated, makes writes idempotent
  profile_id   uuid not null references profiles(id) on delete cascade,
  group_id     uuid not null references groups(id)   on delete cascade,
  total_ml     int  not null check (total_ml between 1 and 20000),
  composition  jsonb not null default '[]'::jsonb,
  note         text check (char_length(note) <= 140),
  photo_path   text,
  thumb_path   text,
  drank_at     timestamptz not null,
  drank_on     date not null,             -- set by trigger, local calendar day
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz                -- soft delete, so deletions can sync
);

create index entries_group_updated_idx on entries (group_id, updated_at);
create index entries_group_day_idx     on entries (group_id, drank_on);
```

### `composition`

A descriptive JSONB array; `total_ml` is authoritative. Kept as JSON rather than a child
table because nothing ever queries inside it — it exists to render
"1 × Garrafa azul + 300 ml".

```json
[
  { "kind": "bottle", "name": "Garrafa azul", "volume_ml": 1500, "qty": 1 },
  { "kind": "loose",  "amount_ml": 300 }
]
```

Bottle name and volume are **snapshotted** at write time, so renaming, changing the volume
of, or archiving a bottle never rewrites history.

### `drank_on` trigger

`drank_on` cannot be a generated column: `timestamptz at time zone 'America/Sao_Paulo'` is
`STABLE`, not `IMMUTABLE`, and generated columns require immutability. A trigger keeps it
correct and keeps the client from having to compute it.

```sql
create or replace function set_entry_day() returns trigger
language plpgsql as $$
begin
  new.drank_on   := (new.drank_at at time zone 'America/Sao_Paulo')::date;
  new.updated_at := now();
  return new;
end $$;

create trigger entries_set_day
  before insert or update on entries
  for each row execute function set_entry_day();
```

### `join_group` RPC

```sql
create or replace function join_group(code text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare gid uuid;
begin
  if auth.uid() is null then
    raise exception 'invalid_code';
  end if;
  select id into gid from groups where invite_code = upper(code);
  if gid is null then
    raise exception 'invalid_code';
  end if;
  insert into group_members (group_id, profile_id)
  values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end $$;
```

---

## 11. Security (RLS)

RLS is enabled on every table. The client talks straight to Postgres, so a wrong policy is
a data leak — these are the policies to get right and to check manually before shipping.

A `security definer` helper avoids the classic recursive-RLS trap, where a policy on
`group_members` queries `group_members`:

```sql
create or replace function is_group_member(gid uuid) returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from group_members
    where group_id = gid and profile_id = auth.uid()
  );
$$;
```

`pg_temp` is pinned last deliberately: Postgres otherwise resolves temporary relations
*before* `pg_catalog`, so an unpinned definer function could be shadowed by a temp table.
Every `security definer` function in the project carries the same setting.

| Table | select | insert | update | delete |
|---|---|---|---|---|
| `profiles` | self, or shares a group with me | self only (`id = auth.uid()`) | self only | — |
| `groups` | `is_group_member(id)` or `created_by = auth.uid()` — the creator disjunct exists because `createGroup` uses `insert … returning` before the creator's membership row exists | `created_by = auth.uid()` | creator only | — |
| `group_members` | `is_group_member(group_id)` | self, and only into a group I created (otherwise use `join_group`) | — | self only (leave group) |
| `bottles` | `profile_id = auth.uid()` | self | self | self |
| `entries` | `is_group_member(group_id)` | `profile_id = auth.uid()` and `is_group_member(group_id)` | self only, and the row must remain in a group the author belongs to — `is_group_member(group_id)` in both USING and WITH CHECK, or an author could move an entry into a group they never joined | **not granted** — deletion is always a soft delete, i.e. an update setting `deleted_at` |

Bottles are strictly private — the partner never needs to read them, because every entry
carries its own snapshot. That keeps the policy trivial.

### Storage

Private bucket `photos`. Paths are `{group_id}/{profile_id}/{entry_id}.jpg` and
`{group_id}/{profile_id}/{entry_id}_thumb.jpg`.

- **read:** first path segment must be a group I belong to
- **write/delete:** first segment a group I belong to **and** second segment `auth.uid()`

Rendering uses signed URLs with a one-hour expiry, cached in the query cache.

### Manual RLS checklist (run before shipping)

Automated multi-user RLS tests would need a dedicated test project — deliberately skipped.
Instead, with two real accounts A and B in different groups, verify by hand:

1. B cannot read A's entries.
2. B cannot read A's bottles, even in the same group.
3. B cannot update or soft-delete A's entry.
4. B cannot insert an entry with `profile_id` set to A.
5. B cannot read A's photo objects.
6. B cannot insert themselves into A's group directly, only via `join_group`.
7. An invalid invite code raises `invalid_code` and creates nothing.

---

## 12. Sync, offline and the outbox

### Reads

On app start and on regaining focus, sync incrementally:

1. Read `lastSyncAt` from IndexedDB.
2. `select * from entries where group_id = ? and updated_at > lastSyncAt`.
3. Merge into the mirror by `id`; drop rows with `deleted_at` set.
4. Store the newest `updated_at` seen as the new `lastSyncAt`.

Soft deletes are what make this correct — a hard delete would be invisible to a watermark
query. Profiles, group and bottles are small and refetched whole on focus.

### Realtime

One subscription: `postgres_changes` on `entries`, filtered `group_id=eq.<my group>`.
Inserts, updates and deletes patch the query cache directly via `setQueryData`. Realtime
is treated as an accelerator, never as the source of truth — the watermark sync on focus
is what guarantees correctness if a socket drops.

### Writes (the outbox)

Every mutation goes into a durable IndexedDB queue before it is attempted:

```ts
type OutboxOp = {
  id: string            // uuid, same id as the entry for inserts
  type: 'insert' | 'update' | 'delete'   // 'delete' is sent as an update setting deleted_at
  payload: EntryPayload
  photo?: Blob          // compressed, awaiting upload
  thumb?: Blob
  createdAt: number
  attempts: number
}
```

- The UI updates optimistically the moment the op is enqueued. Pending entries render with
  a small dot and cannot be edited until confirmed.
- Entry ids are client-generated, so inserts are idempotent: `upsert` on conflict.
- Flush triggers: app start, `visibilitychange` → visible, `online`, and after each
  successful mutation. No background flushing — iOS has no Background Sync.
- Photos upload first; only when both objects land does the entry write go out carrying
  their paths. A failed photo upload retries with the op rather than orphaning the entry.
- Retry with exponential backoff, capped at 5 attempts and 60 seconds. After 5 failures
  the op is marked `failed` and surfaced in Hoje as "Falha ao enviar — tentar novamente",
  with a manual retry. Nothing is ever silently dropped.
- Ordering is FIFO. An update or delete for an entry still queued is merged into the
  pending op instead of being enqueued separately, so a create-then-edit while offline
  produces one clean insert.

### Conflicts

Only the author can edit an entry, so real conflicts require the same person on two
devices. Last write wins on `updated_at`. Documented and accepted; building anything more
would be exactly the kind of machinery this project avoids.

---

## 13. Photos pipeline

1. `<input type="file" accept="image/*">` — on iOS this presents camera or library. No
   custom camera UI.
2. Decode into a canvas, scale so the longest edge is ≤ 1080px, export JPEG at quality
   0.8. Result is typically 150–250 KB.
3. Also export a 96px square centre-cropped thumbnail at quality 0.7 (~8 KB). Generated
   client-side because Supabase image transformations are not on the free tier.
4. Both blobs go into the outbox; the original is discarded and never uploaded.
5. On flush, upload both to the private `photos` bucket, then write the entry with
   `photo_path` and `thumb_path`.
6. Lists render `thumb_path`; the expanded row and Histórico render `photo_path`. Signed
   URLs, one-hour expiry, cached.
7. Deleting an entry soft-deletes the row and removes both objects. If object removal
   fails, the row is still deleted — an orphaned object costs nothing and a cleanup can be
   done by hand.

At 200 KB per photo, the 1 GB free tier holds roughly 5,000 photos, or several years of
occasional use.

---

## 14. Error handling

The principle: **never fail silently, and never block the fast path**.

| Situation | Behaviour |
|---|---|
| Offline register | Succeeds locally, syncs later. A "sem conexão" pill appears in the header |
| Failed sync (transient) | Silent retry with backoff; nothing shown until 5 attempts fail |
| Failed sync (final) | Entry shows "Falha ao enviar — tentar novamente" with a retry button |
| Photo too large / unreadable | "Não foi possível usar essa imagem." Register proceeds without it |
| Expired session | Redirect to login, outbox preserved and flushed after re-auth |
| Invalid invite code | Inline "Código inválido" on the field |
| Realtime socket dropped | Silent. Focus-sync covers it. A stale-data pill appears after 5 minutes with no successful sync |
| Unexpected render error | Error boundary per tab: "Algo quebrou nesta aba" plus a reload button, so one broken screen never takes down the app |

---

## 15. Testing strategy

Testing concentrates where bugs would actually hurt: the pure functions that decide who is
winning. Those are cheap to test and expensive to get wrong.

**Vitest — pure logic (the priority):**
- `periods.ts` — day/week/month/total boundaries, Monday week start, São Paulo offset,
  month and week arithmetic across year boundaries
- `rankings.ts` — totals per member per period, ordering, ties, empty periods
- `averages.ts` — days-elapsed divisor, best day, days registered
- `streaks.ts` — consecutive days, today-not-yet-logged behaviour, gaps, backdated repair
- `features/fish/unlocks.ts` — every one of the thirteen fish conditions, boundary values
- `features/celebrations/engine.ts` — priority ordering, one-full-screen rule, day-one has
  no record
- `composition.ts` — bottles × quantity + loose amount, rounding, formatting
- `format.ts` — "1,8 L" vs "350 ml" thresholds, decimal comma

**Vitest + RTL — components:**
- Register sheet: bottle tap increments, running total, disabled CTA at zero
- Compact row: expand/collapse, edit and delete only on own entries
- Outbox: enqueue → optimistic render → confirm clears the pending dot

**Playwright — one smoke flow**, mobile viewport (iPhone 14 preset):
login → register 500 ml → appears in Hoje → appears in Ranking → survives reload.

**Manual:** the RLS checklist in §11, plus installing to a real iPhone home screen and
verifying standalone display, safe areas, and an offline register surviving a force-quit.

No unit tests for RLS policies and no visual regression testing in v1 — both need
infrastructure that outweighs their value here.

---

## 16. Project structure

Small, focused modules. A file that grows past roughly 200 lines is a signal it is doing
too much.

```
src/
  main.tsx
  app/
    router.tsx            routes: /hoje /ranking /historico /perfil + /registrar modal
    providers.tsx         query client, persister, auth, realtime
    TabBar.tsx
    ErrorBoundary.tsx
  screens/
    auth/                 Login, SignUp
    onboarding/           Nome, Peixe, Grupo
    hoje/                 Hoje, ProgressStrip, MemberTube, EntryRow, EntryRowExpanded
    registrar/            RegisterSheet, BottleGrid, Keypad, OptionalChips
    ranking/              Ranking, PeriodControl, Standings, StatsCompare, MonthWrapUp
    historico/            Historico, CalendarGrid, DayDetail
    perfil/               Perfil, FishGallery, BottleManager, GroupCard
  features/
    entries/              queries.ts mutations.ts outbox.ts sync.ts realtime.ts
    bottles/              queries.ts mutations.ts
    group/                queries.ts joinGroup.ts createGroup.ts
    fish/                 catalog.ts unlocks.ts Fish.tsx svg/
    celebrations/         engine.ts Celebration.tsx timelines.ts
  lib/
    supabase.ts  idb.ts  dates.ts  periods.ts  rankings.ts  averages.ts
    streaks.ts  composition.ts  format.ts  image.ts  strings.ts
  styles/
    tokens.css  globals.css
  ui/                     shadcn primitives + Button, Card, Sheet, Segmented, Toast
docs/
  superpowers/specs/      this document
```

`lib/strings.ts` holds every pt-BR string. Not for future translation — so copy can be
reviewed in one place.

---

## 17. Out of scope for v1

Listed explicitly so they don't creep in:

- Push notifications and drink reminders
- Comments and emoji reactions
- Daily goals and goal-based ranking
- Charts and trend graphs
- Light theme, or a theme toggle
- Rive animations
- Desktop or tablet layouts
- More than one group per user
- Data export
- Password reset UI
- Anti-cheat of any kind
- Any language other than pt-BR

---

## 18. Future upgrades

Each is a self-contained addition, deliberately deferred:

- **Push notifications** — reminders and partner-activity nudges. Needs a server piece
  (Vercel function plus a cron) and a `push_subscriptions` table. Works on iOS 16.4+ only
  for home-screen-installed apps. The most likely first addition once the habit sticks.
- **Rive for one large moment** — the full-screen celebration or the Perfil fish gallery,
  where scale makes the quality visible. Requires ~$9/mo for `.riv` export. The
  `<Fish variant level state size />` boundary already permits a per-fish swap with no
  caller changes.
- **Charts in Histórico** — a 14-day bar chart and a monthly trend line.
- **Incremental photo cleanup** — a scheduled job removing objects orphaned by failed
  deletes.
- **A third member** — the schema, RLS and the scrollable column strip already support it.
  Only the Ranking comparison card assumes two columns and would need to become a list.
