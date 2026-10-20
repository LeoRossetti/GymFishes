# M8 — Conquistas Implementation Plan

> Executed inline on 2026-09-24, the same day it was asked for. Kept as the record of what was
> built and why; the binding text is main spec §2, §6, §7, §15 and §18.

**Goal:** Put the nine non-starter fish back behind achievements a regular user completes in about
a month, none of them waiting for a month to end and not only about streaks; move the tambaqui to
the middle of that ladder; make earning one feel like a game reward; and let the three full-screen
celebrations be watched as GIFs without a phone.

**Architecture:** unchanged. Unlocks stay a pure function of your own registers (`unlocks.ts`),
evaluated where celebrations already are (after each of your registers). The only new date math
is `hourOf` in `dates.ts`. The reward screen is the existing `CelebrationScreen` unlock body. A
new dev script mirrors `fish:sheet` for the celebrations.

**Spec:** `docs/superpowers/specs/2026-08-11-gymfishes-design.md` §6 (ladder, how unlocks work),
§7 (reward screen), §15 (the shots script), §18 (Duolingo-style animations, deferred).
**Roadmap:** `docs/superpowers/plans/ROADMAP.md`, M8.

## Tasks, as executed

- [x] **Hour helper** — `hourOf(d)` in `src/lib/dates.ts`, São Paulo wall clock; test in
      `dates.test.ts` (11:59Z → 8, 12:00Z → 9, 02:30Z → 23).
- [x] **Catalog** — `FISH_IDS` in ladder order (tambaqui ninth overall, fifth of nine), `Unlock`
      kinds `starter | bottle | note | morning | streak | record | count | volume`, the ladder of
      spec §6, `ALL_FISH_AVAILABLE = false`, `unlockLabel` for every kind; `STREAK_MILESTONES`
      now 3/7/14. Tests in `catalog.test.ts`.
- [x] **Unlock facts** — `UnlockEntry` (a `RankableEntry` plus optional `drank_at`, `note`,
      `composition`), `unlockFacts` with `registers`, `usedBottle`, `wroteNote`, `earliestHour`;
      `meets` per kind; `unlockedFish` / `availableFish` without `monthsWon`. Tests in
      `unlocks.test.ts` cover every boundary.
- [x] **Months won removed** — `monthsWon` deleted from `lib/wrapup.ts` and its tests;
      `dayState.ts` and `FishGallery.tsx` no longer compute it.
- [x] **Gallery** — the fish you wear is added to the unlocked set so it never shows locked.
- [x] **Seen unlocks** — `CelebrationProvider` counts a fish as seen only if it was unlocked
      before the register being evaluated; tests cover the phone that stored all thirteen, a fish
      earned on another device, and "Escolher agora".
- [x] **Reward screen** — `CelebrationScreen` unlock body: checked chip with the achievement
      (`Check` icon, `--color-streak`), the fish scaling in on a spring behind one flat ring that
      expands and fades, then "Novo peixe!" and the name; reduced motion keeps the crossfade only.
- [x] **Strings** — `peixes.registreComGarrafa`, `registreComNota`, `registreAntesDas`,
      `registros`; `celebracoes.conquista` (screen-reader prefix on the chip); `ganharMeses`
      removed.
- [x] **Celebration shots** — `scripts/celebration-shots.{html,entry.tsx,mjs}` and
      `npm run celebration:shots`: Vite dev server on 4174, Playwright WebKit iPhone 14, frames
      at 0/150/300/500/800/1200/2000 ms into a strip, the `.webm`, and a 12 fps GIF made from
      ffmpeg PNG frames through Pillow with one shared palette. Output in `.tmp/celebracoes/`.
- [x] **Docs and version** — spec sections above, roadmap row and section, README feature line
      and command row, `package.json` 1.2.0 (also the persister buster).

## Verification

- `npm run typecheck` and `npm run test:run` green (471 tests).
- `npm run celebration:shots` produced `unlock`, `record` and `streak` strips, videos and GIFs;
  the unlock strip shows the chip, the ring and the fish at 500–2000 ms.
- Owner, on a real phone: register using a bottle → "Novo peixe! Baiacu" with the chip
  "Registre com uma garrafa"; Perfil › Trocar peixe shows the nine conditions; the fish you had
  chosen is still selectable.
