# GymFishes — M9: Fechamento

**Date:** 2026-10-20
**Parent spec:** [`2026-08-11-gymfishes-design.md`](2026-08-11-gymfishes-design.md) — this document
records the decisions of the final wrap-up review; the parent spec is updated in the same change
and remains the binding description.

## 1. Why

The app is complete (M1–M8). A final read-only review on 2026-10-19 (integrity, UX with the
Intent skills, visual with frontend-design and impeccable, and a PWA install study) found no
Critical, High or Medium integrity issue and a set of design soft joints. The owner judged every
proposed change against before/after renders on the M7 canvas and approved the list below,
rejecting two: the red destructive buttons stay as they are, and no streak animation is added.

Nothing here adds a screen or an option. Every item is a removal, a size, a token, or a tiny
behaviour fix, except the install row in Perfil, which is one hook and one button.

## 2. Decisions

### Register sheet (§5.2)

- The confirm button is **sticky at the bottom of the sheet's scroll area**, on the sheet's own
  background, so it never sits below the fold when the note is open or bottles grow.
- The unit in the confirm label keeps its case: "REGISTRAR 250 ml", not "250 ML".
- Opening the sheet moves focus to its handle ("Fechar"); **Escape closes** it.
- The blue loose-amount line under the pills is **removed**: the running total and the subtitle
  already show it.
- Keypad keys are **48px** tall with **20px / 800** digits; segmented controls use **15px** labels;
  a selected bottle tile has a **2px** border like every other selection.

### Hoje (§5.1)

- The fish is drawn **only when the water is at least as deep as the fish** (35px of the 220px
  tube; 480 ml on the 3 L scale). Below that the tube shows water only. Between 480 and 560 ml the
  fish stays 6px under the crest and its belly is clipped by the floor by a few pixels (M9b).
- Loose-only register rows have **no subtitle** (it repeated the amount) and, expanded, **no
  composition chips**.
- The totals and the gap line keep their sizes: the owner reads the water levels first.
- The streak chip carries an accessible name ("Sequência de N dias"); the sync pill is a status
  region and reads "Pode estar desatualizado".

### Ranking and Histórico (§5.3, §5.4)

- "Médias e recordes" renders **only for the week, month and all-time periods, and only when at
  least one member has water in the period**. On the day period it repeated the standings; on an
  empty period it printed zeros.
- The month wrap-up's close control is the shared `Close` icon.
- Today's calendar ring is `--ink`, so it stays visible on a fully filled day.

### Celebrations (§7)

- **No toast is drawn while a full screen is up.** Outranked kinds are dropped, not demoted: the
  lead is visible on Hoje's gap line the moment the screen closes, the streak on its chip.
- When the register that earned the **new-fish** screen also put the author in the lead, a flat
  yellow **trophy** (44px, the shared icon) springs in above the achievement chip. Screen-reader
  name: "Você está na frente". The record and streak screens carry no marker.
- The expanding **ring behind the fish is removed**. The app has no pulse anywhere.

### Themes (§8, M7 §7)

- **Tinta is removed**: it was Breu with a hint of blue. Five themes remain; a device that stored
  `tinta` falls back to Fundo do mar.
- Breu's `--surface` becomes `#1B1E24` so cards clear the L* 5 floor.

### Install (§5.5, §9)

- Perfil gets an **"Instalar o app"** ghost button between the group card and Sair, rendered only
  while the browser has offered `beforeinstallprompt` and the app is not running standalone; tapping
  it calls the browser's prompt. The event is captured at app start (module scope), since Chrome fires it
  before Perfil opens. On an iPhone browser, not standalone, one line replaces it: "No
  iPhone: Compartilhar → Adicionar à Tela de Início". iOS has no install API; this is the ceiling.
- The manifest gains `description`, `lang` and `id` (`/hoje`, the start_url); the README a "Como instalar" section.
- **App icon and favicon** are the owner's illustration of a fish in bed dreaming of a glass of
  water (`docs/img/icone-origem.jpg`), at 512 and 192 (`any`), 180 for the Apple touch icon, and a
  maskable 512 with the scene at 80% on the illustration's own slate background `#2B3D4B`. The
  drop icon is removed.

### Small fixes

- Tabs open at the top: the shell's scroll region remounts per route.
- Inputs show one focus ring (the global one), not two.
- The colour swatches in Perfil expose `aria-pressed`.
- The toast keeps its text on one line up to the screen width.
- The bottle form's save button reads "Salvar garrafa".
- Version 1.3.0, which also busts the persisted query cache.

## 3. Rejected, recorded

- Larger totals on Hoje (the tubes are the first read).
- A lead marker on the record and streak screens; a pulse of any kind.
- A daily streak animation on the chip or a Duolingo-style streak screen.
- Red border on destructive buttons (the red text stays).
- An "e-mail not confirmed" branch at login (confirmations are off in the cloud project).

## 4. Out of scope

The e2e smoke and every cloud-dependent check wait for the owner's Supabase reset.

## 5. Polimento pós-auditoria (2026-10-20)

After M9 shipped on the branch, four read-only audits (mobile-native, Emil Kowalski's design
engineering review, a worst-case-data stress test, and the motion standards) proposed small,
user-felt fixes. The owner approved these ten; none adds a mechanism, option or screen.

1. **Press feedback lands instantly.** One global rule, `:is(button, a):active { transition-duration: 0ms }`,
   so a tap shows on the first frame; release keeps each control's 100 ms fade.
2. **The primary button never shifts layout.** Pressing keeps the resting box (`active:mb-1` replaces the
   removed 4px edge); disabled keeps a 4px edge in the surface colour instead of a 1px line; the drop
   is instant (no `transition-transform`) on the primary button and on the floating plus.
3. **Counting numbers.** `useCountUp` starts from the number on screen, never from the previous target;
   easing `[0.23, 1, 0.32, 1]` over the same 500 ms; the register sheet's total echoes typed digits
   instantly (no count-up there); counted numbers use tabular digits.
4. **Register sheet.** A flick closes it (`velocity.y > 500` or the existing 80px); reduced motion is a
   120 ms crossfade like every other surface; the sheet scroller contains overscroll; reopening the sheet
   while it is leaving gets a fresh instance (keyed by a counter in the shell).
5. **Long-press and press states.** `button, nav a` are not selectable and show no iOS callout; the
   foto/nota/agora chips and the ×qty badges show their press on the visible element.
6. **Ranking with long names.** The standings name wraps inside the 44px row instead of truncating; the
   stats headers are spaced; stats cells never wrap; totals have a minimum width so the share bars share
   one track length.
7. **An empty tube draws no crest.** The water block always renders (so the first drink still rises); only the crest hides while the total is zero (amended in review).
8. **Two bugs.** The splash resets when a register is deleted within 450 ms; see 4 for the sheet instance.
9. **The fish rides the water.** The fish lives inside the water block, 6px under the crest, so it follows
   the level's own spring; `fishBottomPx` is deleted. The 480 ml threshold stays; between 480 and
   560 ml the fish's belly may be clipped by a few pixels at the floor, which is accepted.
10. **Small polish.** Rounded press highlights on the stepper arrows and the entry rows; a fixed emoji slot
    aligns the bottle rows in Perfil; entering fades use ease-out; the day detail's smooth scroll is
    instant under reduced motion.

## 6. Candidates to be shown, not yet decided

The audits also proposed mechanisms the owner wants to see built before deciding: a backdrop fade for
the sheet, toast enter/exit motion, an animated row expand, a sliding segmented indicator, a fade-out
when a celebration ends, auto-disarming "Excluir mesmo?", shorter tube and celebration springs, names
on the wrap-up totals, a lower bound on Histórico month navigation, and narrower tubes for 320px
screens. They are rendered on the M7 canvas from a throwaway copy; whatever he keeps is recorded here.
