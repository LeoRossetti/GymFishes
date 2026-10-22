# M10 — Aquário vivo, peixes e conquistas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn each member's water tube into a living river or reef that builds as the day's water rises, replace and
redraw the fish into a 9 + 9 roster drawn from photos, and make the achievements a four-month ladder whose progress
shows in the gallery.

**Architecture:** The aquarium is a new feature folder `src/features/aquarium/`: pure colour/ladder/lift logic,
the approved art reference ported to TypeScript (string-building SVG, memoized per tube and millilitre), and one
`Aquarium` component that `MemberTube` renders inside its water. A per-device "Tubo" switch in Perfil turns it off.
The fish catalog grows a `habitat` and a new ladder; unlocks stay derived from registers with new all-time facts
and a progress function the gallery shows.

**Tech Stack:** React 19 + TypeScript strict (`noUncheckedIndexedAccess`), Vite, Tailwind v4 tokens, `motion`,
Vitest + React Testing Library, Playwright (bundled Chromium) for screenshots.

**Specs:** `docs/superpowers/specs/2026-10-20-m10-aquario-design.md` (aquarium, approved as written) and
`docs/superpowers/specs/2026-10-22-m10-peixes-conquistas-design.md` (fish and achievements). Read the one(s) your
task names, plus `CLAUDE.md`. Main spec: `docs/superpowers/specs/2026-08-11-gymfishes-design.md`.

## Global Constraints

- Branch `m10`. Never push, merge or open a PR. No Claude/AI branding anywhere in the repo.
- Interface pt-BR only; every user-visible string in `src/lib/strings.ts`; numbers via `formatVolume` (decimal comma).
- Dates and hours only through `src/lib/dates.ts` / `src/lib/periods.ts` (`hourOf`, `DayKey`, `addDays`).
- Colours only via tokens, except the documented palettes: fish species (hex in each art file) and the aquarium's
  decor palettes (hex per habitat). No gradients, glow or shadows. Touch targets ≥ 44 px.
- TypeScript strict, `noUncheckedIndexedAccess`, no `any`. Files over ~200 lines are split.
- Pure logic in a pure module with unit tests; components read data through hooks (never `supabase` directly).
- No schema change; `src/lib/database.types.ts` untouched.
- Repo files are CRLF: edit with the Edit tool after a Read (or a script that keeps line endings).
- Before every commit: `npm run test:run`, `npm run typecheck` (and `npm run build` on tasks that touch bundling).
- Commit messages: conventional (`feat(aquarium): …`, `feat(fish): …`, `test: …`, `docs: …`), in English.
- Approved art is ported, never redrawn: the aquarium from `docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs`
  and `reef.mjs`; the fish from `.tmp/m10/fish/<id>.ts` (git-ignored scratch, present on disk).

## Review Focus

1. **The scale passes 3 L** (a big day raises every tube's scale): the scene stays full, mid-water pieces (school,
   drifting leaves, jellyfish) wait until the water covers them, the water colour stays at the habitat end. → Task 3
   (`pieceVisible`) and Task 7 (a tube at 4 L with scale 5 L).
2. **Two or three tubes on one page** never share SVG/CSS ids (clip paths, keyframe names): two tubes of the same
   habitat and millilitres must render distinct ids. → Task 6 test "two tubes never share an id".
3. **Storage blocked** (private mode): the Tubo switch falls back to "Com cenário" and still toggles for the
   session; achievements and the gallery never touch storage. → Task 2 tests.
4. **A profile wearing a dropped fish** (`octopus`, `seahorse`, `turtle`, `dolphin`) renders the replacement
   everywhere (tube, ranking, gallery "yours") and the gallery counts it as owned. → Task 9 `fishOf` tests and
   Task 10 gallery test.
5. **A register made before 9h in São Paulo but late the previous night in UTC** (or vice versa) counts on the
   right day for `mornings` and `goalDays`. → Task 8 tests with explicit UTC instants.

---

## Part A — The living aquarium (spec 2026-10-20)

### Task 1: Water colour and the habitat field

**Files:**
- Create: `src/features/aquarium/color.ts`, `src/features/aquarium/color.test.ts`
- Modify: `src/features/fish/catalog.ts` (add `Habitat`, `HABITAT`, `habitatOf`), `src/features/fish/catalog.test.ts`

**Interfaces:**
- Produces: `type Habitat = 'fresh' | 'salt'`; `HABITAT: Record<FishId, Habitat>`; `habitatOf(id: FishId): Habitat`
  (catalog). `mixOklab(a: string, b: string, t: number): string` (uppercase `#RRGGBB`);
  `type TubeWater = { fill: string; hi: string }`; `HABITAT_WATER: Record<Habitat, TubeWater>` (river
  `#2A9C80`/`#6ACDB2`, reef `#1769C2`/`#4F98E6`); `FULL_ML = 3000`;
  `tubeWater(ml: number, habitat: Habitat, start: TubeWater): TubeWater` (linear in ml, clamped 0…3000).

- [ ] **Step 1: Write the failing tests**
  - `mixOklab`: t=0 returns `a`, t=1 returns `b` (uppercase hex), and `mixOklab('#1CB0F6','#2A9C80',0.5)` equals the
    reference's `mix` for the same inputs — compute that value once with node
    (`node -e "import('./docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs').then(m=>console.log(m.mix('#1CB0F6','#2A9C80',0.5)))"`)
    and pin it as a literal (typed tests must not import the untyped reference).
  - `tubeWater`: 0 ml → `start`; 3000 ml and 5000 ml → `HABITAT_WATER[habitat]`; 1500 ml → the 0,5 mix of start and end
    for both fill and hi; negative ml → start.
  - catalog: every id in `FISH_IDS` has a habitat; `guppy, betta, goldfish, neon, tambaqui` are `fresh`, the other
    eight `salt` (this list changes in Task 9).
- [ ] **Step 2: Run them, see them fail** — `npx vitest run src/features/aquarium/color.test.ts src/features/fish/catalog.test.ts`
- [ ] **Step 3: Implement** the OKLab mix as typed TypeScript (port the reference's `toLab`/`fromLab`/`mix`), `tubeWater`,
  and the catalog's `HABITAT` + `habitatOf`.
- [ ] **Step 4: Run the tests, all pass**; `npm run typecheck`.
- [ ] **Step 5: Commit** `feat(aquarium): OKLab water mix and a habitat per fish`

### Task 2: The "Tubo" switch

**Files:**
- Create: `src/features/aquarium/tubeStyle.ts`, `src/features/aquarium/useTubeStyle.ts`,
  `src/features/aquarium/tubeStyle.test.ts`, `src/features/aquarium/TubeStylePicker.tsx`
- Modify: `src/lib/strings.ts` (`tubo: { titulo: 'Tubo', cenario: 'Com cenário', agua: 'Só água' }`),
  `src/screens/perfil/Perfil.tsx` (render `<TubeStylePicker />` right under `<ThemePicker />`),
  `src/screens/perfil/Perfil.test.tsx`

**Interfaces:**
- Produces: `type TubeStyle = 'cenario' | 'agua'`; `TUBE_STYLE_KEY = 'gymfishes:tube'`;
  `readTubeStyle(): TubeStyle` (default `'cenario'`, also on unknown values and blocked storage);
  `storeTubeStyle(s: TubeStyle): void` (swallows storage errors); `useTubeStyle(): { style: TubeStyle; setStyle(s: TubeStyle): void }`.
- Pattern: `src/features/theme/theme.ts` + `useTheme.ts`. The picker uses `src/ui/Segmented.tsx` with the heading
  styled like Tema's heading in `ThemePicker`.

- [ ] **Step 1: Write the failing tests** — `readTubeStyle` returns `'cenario'` with nothing stored, with `'xyz'`
  stored, and when `localStorage.getItem` throws; returns `'agua'` when stored; `storeTubeStyle` does not throw when
  `setItem` throws. Perfil test: the "Tubo" group is present with "Com cenário" pressed by default; clicking "Só água"
  presses it and stores `'agua'` under `gymfishes:tube`.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement** the module, the hook (state initialised from `readTubeStyle`, setter stores and sets),
  the picker and the Perfil placement.
- [ ] **Step 4: Run, all pass**; typecheck.
- [ ] **Step 5: Commit** `feat(aquarium): Tubo switch in Perfil (Com cenário / Só água)`

### Task 3: The ladder, mid-water waits and the fish lift

**Files:**
- Create: `src/features/aquarium/ladder.ts`, `src/features/aquarium/ladder.test.ts`
- Modify: `src/screens/hoje/MemberTube.tsx` (use `fishTop`), `src/screens/hoje/MemberTube.test.tsx`

**Interfaces:**
- Produces: `SCENE_W = 156`, `SCENE_H = 216` (the tube's inner box);
  `type PieceSpec = { at: number; midTop?: number }` (`midTop`: the piece's top edge in scene px, only for
  mid-water pieces); `pieceVisible(p: PieceSpec, ml: number, surfaceY: number): boolean` (shown once `ml >= p.at`,
  and for mid-water pieces also only when `surfaceY <= p.midTop`); `surfaceYOf(ml: number, scaleMl: number): number`
  (scene px from the top: `SCENE_H * (1 - min(1, ml/scaleMl))`);
  `fishTop(waterPx: number, fishH: number): number` → `min(6, waterPx - fishH)` (spec §3.4: 6 px under the crest,
  never below `water − fish height`).

- [ ] **Step 1: Write the failing tests** — `pieceVisible`: a floor piece at 1000 shows at 1000 and not at 999; a
  mid-water piece `{ at: 3000, midTop: 60 }` shows at 3000 ml with scale 3000 (surface 0) and does not show at 3000
  ml with scale 6000 (surface 108); `fishTop(220, 35)` = 6, `fishTop(38, 35)` = 3, `fishTop(35, 35)` = 0.
  MemberTube: with `totalMl` 500 and `scaleMl` 3000 the fish's wrapper `top` is `min(6, 36.7 − 35)` px (not the old
  fixed 6 px), so its belly is not clipped.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement** `ladder.ts`; in `MemberTube` replace the fixed `top-[6px]` with an inline `top` from
  `fishTop((pct/100)*TUBE_H, FISH_H)` (the lift applies with the switch on and off, spec §3.4).
- [ ] **Step 4: Run, all pass**; typecheck.
- [ ] **Step 5: Commit** `feat(aquarium): ladder visibility and the fish riding up in shallow water`

### Task 4: Port the art primitives and the river

**Files:**
- Create: `src/features/aquarium/art/prims.ts` (the reference's `r2`, `piece`, cubic sampling `at3`/`samplePath`/
  `smooth`, `ribbonPath`, `tick`, `wob`, `node`, `grassSegs`, `grass`, `mossCluster`, `fallenLeaf`, the id space),
  `src/features/aquarium/art/river-floor.ts` (bed, rocks, short/tall grass, sword plant, log, moss, leaves),
  `src/features/aquarium/art/river-life.ts` (far plane, school, roots, shrimp, crab), `src/features/aquarium/art/river.ts`
  (the palette `C`, the `PIECES` list and `SOURCES`, `riverScene`, `riverInAir`), `src/features/aquarium/art/river.test.ts`
- Reference: `docs/superpowers/specs/2026-10-20-m10-aquario/river.mjs` — port every function, constant, coordinate
  and colour exactly; only add types and split files. Keep its doc comments.

**Interfaces:**
- Consumes: `mixOklab`, `TubeWater` (Task 1), `PieceSpec`, `pieceVisible` (Task 3).
- Produces: `type IdSpace = { prefix: string; next(): string }` and `idSpace(prefix: string): IdSpace` (replaces the
  reference's module-level `beginIds`/`uid` so two tubes rendering at once can never interleave ids);
  `riverScene(ml: number, water: TubeWater, surfaceY: number, ids: IdSpace): string` (the pieces' SVG markup, no
  `<svg>` wrapper, no bubbles); `riverInAir(ml: number, water: TubeWater, ids: IdSpace): string` (the roots for the air,
  `''` below 2000 ml); `RIVER_SOURCES: readonly BubbleSource[]` with `type BubbleSource = { at: number; x: number; y: number; n: number; seed: number }`.
  Mid-water pieces (`school`, the two drifting leaves at 3000) carry `midTop` (their top edge in scene px, measured
  from the reference's coordinates). Each piece's markup is wrapped in `<g data-piece="<name>">` (names like `bed`,
  `rocks`, `school`, `leaf-drift-1`) so tests can find pieces.

- [ ] **Step 1: Write the failing tests** — for ml 500, 1000, 1500, 2000, 2500, 3000: `riverScene` output contains no
  `NaN`/`undefined`; is empty at 500; grows strictly from 1000 to 3000; every `id="…"` starts with the given prefix;
  `riverInAir` is `''` at 1999 and non-empty at 2000; the 3000 ml scene has `data-piece="school"` and the 2500 ml one
  does not.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Port.** No runtime work beyond the reference's string building.
- [ ] **Step 4: Run, all pass**; typecheck. Then verify parity once with a throwaway script in `.tmp/` (loaded through
  `vite`'s `ssrLoadModule`, like `.tmp/m10/fish/draw.mjs`): for 1000, 2000 and 3000 ml, water = the reference's
  `waterAt(ml,'fresh')`, surface 0, the multiset of `d="…"` values in the ported scene equals the reference
  `freshScene`'s (bubbles excluded). Any difference is a porting bug.
- [ ] **Step 5: Commit** `feat(aquarium): river art ported from the approved reference`

### Task 5: Port the reef

**Files:**
- Create: `src/features/aquarium/art/reef-floor.ts` (sand, rocks, brain/finger/staghorn coral, sea fan, anemone, shells,
  urchin, starfish), `src/features/aquarium/art/reef-life.ts` (anchor, chain, kelp, the decor seahorse, jellyfish, far
  reef, its school), `src/features/aquarium/art/reef.ts` (palette `RAW` → sunk `R`, `PIECES`, `SOURCES`, `reefScene`,
  `reefInAir`), `src/features/aquarium/art/reef.test.ts`
- Reference: `docs/superpowers/specs/2026-10-20-m10-aquario/reef.mjs`.

**Interfaces:**
- Consumes: Task 4's `prims.ts`, `IdSpace`, `BubbleSource`.
- Produces: `reefScene(ml, water, surfaceY, ids): string`, `reefInAir(ml, water, ids): string` (the chain, `''` below
  2000), `REEF_SOURCES`. Mid-water: the school and both jellyfish carry `midTop`.

- [ ] **Step 1–5:** the same tests and the same one-off parity check as Task 4, against the reference
  `reefScene`/`reefChainInAir` (empty at 500, growth, prefixes, no NaN, `data-piece` wrappers, parity at 1000/2000/3000).
  Commit `feat(aquarium): reef art ported from the approved reference`.

### Task 6: Bubbles and the scene assembly

**Files:**
- Create: `src/features/aquarium/bubbles.ts`, `src/features/aquarium/scene.ts`, `src/features/aquarium/scene.test.ts`
- Modify: `src/styles/globals.css` (`[data-waves='paused'] .aq-bubble, [data-waves='paused'] .aq-bubble > g
  { animation-play-state: paused }`; under `prefers-reduced-motion: reduce` `.aq-bubble { display: none }`)

**Interfaces:**
- Consumes: Tasks 1, 3, 4, 5.
- Produces: `bubbleField(ml: number, water: TubeWater, surfaceY: number, sources: readonly BubbleSource[], prefix: string): { css: string; svg: string }`
  (port of the reference's `bubbleField`: period 8 s, speed `30 + 6 × radius` px/s, rise to 6 px under the surface,
  sway 0,6–1,8 px, scale 0,8→1,12, fades over the first 6 % and last 10 %, fill = water mixed 30 % toward white, rim
  = `water.hi` at 0,9 px, highlight `#EAFBF5`; class `aq-bubble` on each bubble group);
  `type SceneMarkup = { water: TubeWater; scene: string; air: string; css: string }`;
  `buildScene(habitat: Habitat, ml: number, scaleMl: number, start: TubeWater, prefix: string): SceneMarkup`
  (memoized on its arguments with a small LRU of ~16 entries, so re-renders never rebuild paths).

- [ ] **Step 1: Write the failing tests** — `buildScene` returns the same object for the same arguments (memo);
  two calls with prefixes `a` and `b` share no `id="…"` and no `@keyframes` name; bubbles: none below 1000 ml, sources
  join at their marks (count `aq-bubble` groups at 1000 vs 3000), no bubble when the rise is ≤ 6 px; the water is
  `tubeWater(ml, habitat, start)`; `air` is `''` below 2000.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, all pass**; typecheck.
- [ ] **Step 5: Commit** `feat(aquarium): bubbles and a memoized scene per tube`

### Task 7: The aquarium in the tube

**Files:**
- Create: `src/features/aquarium/Aquarium.tsx`, `src/features/aquarium/Aquarium.test.tsx`
- Modify: `src/screens/hoje/MemberTube.tsx`, `src/screens/hoje/MemberTube.test.tsx`, `src/screens/hoje/WaveSurface.tsx`
  (only if needed to read the per-tube colours), main spec §5.1/§5.5/§6/§8 and the aquarium spec's status line

**Interfaces:**
- Consumes: `buildScene`, `habitatOf`, `useTubeStyle`, `fishTop`, `THEMES` + the stored theme
  (`readStoredTheme()` from `src/features/theme/theme.ts`) for the start colours (`{ fill: THEMES[t].water, hi: THEMES[t].waterHi }`).
- Produces: `<Aquarium habitat ml scaleMl waterPx innerWidth prefix />` rendering two layers and `MemberTube`
  wiring.

Behaviour (spec §3.2–3.8, all pinned there): the tube root sets `--color-water` and `--color-water-hi` inline to the
mixed water when the style is `'cenario'` (so `bg-water`/`fill-water-hi` inside pick it up; nothing outside the tube
changes); the scene layer is clipped to the water (it lives inside the water's `motion.div`, anchored to the floor,
`SCENE_W × SCENE_H` scaled horizontally to the tube's inner width with `transform: scaleX(innerWidth / 156)`, origin
bottom-left) and paints above the crest and below the fish; the air layer (roots/chain) sits above the water, clipped
to the part of the tube above the surface, overlapping the water by 1,5 px; the fish is last. New pieces fade in over
400 ms ease-out (opacity only) when a drink crosses a mark while Hoje is open, none on first render, none under reduced
motion. `'agua'` renders exactly today's tube (no scene, no bubbles, theme water) with the Task 3 lift. Inner width
comes from a `ResizeObserver` on the tube (fallback 156). The `prefix` is unique per tube (`useId`).

- [ ] **Step 1: Write the failing tests** — with style `'cenario'`: a 3000 ml tube of a `fresh` fish renders the
  scene (an element with `data-aquarium="fresh"`) and sets `--color-water` on the tube root to `#2A9C80`; a `salt`
  fish renders `data-aquarium="salt"` and `#1769C2`; at 500 ml there is no scene content and no bubble; with style
  `'agua'` there is no `data-aquarium` element and no inline `--color-water`; a 4000 ml tube with scale 5000 shows the
  floor pieces but not the school (mid-water wait) — assert via a `data-piece` attribute the port puts on each piece
  group; under reduced motion (`matchMedia` mock) no `.aq-bubble` renders and no fade class is applied; two tubes on
  one page share no `id`.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement** `Aquarium` and the `MemberTube` wiring.
- [ ] **Step 4: Run all tests; typecheck; build.**
- [ ] **Step 5: Visual check.** Start `npx vite --port 4175 --strictPort` (stop only your own PID afterwards). Copy
  `.tmp/m10/capture2.mjs` to `.tmp/m10/capture3.mjs` and remove its mockup injection (the `page.evaluate` that
  writes the mock scene into the tubes, and the `scene.mjs`/`reef.mjs` imports), keeping the backend stand-in
  (`installMock`, scenarios `nivel-<ml>`), the fish choice and the animation seeking; the real app now draws the
  scene. Capture Leo's tube at 500, 1000, 1500, 2000, 2500 and 3000 ml for a river fish and a reef fish
  (`clownfish`). Read the PNGs and compare with the approved mockup PNGs in `.tmp/m10/out/` (`l*-tube.png` for the
  river ladder, `r*-tube.png`, `ladder.png`). Any difference other than the horizontal squeeze is a bug.
- [ ] **Step 6: Update docs** — main spec §5.1 (the tube as aquarium), §5.5 (Tubo), §6 (habitat), §8 (decor palette
  exception; bubbles and the 400 ms fade in Motion); aquarium spec status "Built on branch m10 (2026-10-2x)".
- [ ] **Step 7: Commit** `feat(aquarium): the living river and reef in each tube`

---

## Part B — Fish and achievements (spec 2026-10-22)

### Task 8: New achievement kinds, facts and progress

**Files:**
- Modify: `src/features/fish/catalog.ts` (`Unlock` union), `src/features/fish/unlocks.ts`, `src/features/fish/unlocks.test.ts`

**Interfaces:**
- Produces (added to the `Unlock` union, alongside the old kinds until Task 9 removes them):
  `{ kind: 'mornings'; before: number; days: number }`, `{ kind: 'goalDays'; ml: number; days: number }`,
  `{ kind: 'days'; days: number }`; `record` now meets at `bestDayMl >= ml` (was `>`).
  `UnlockFacts` gains `registeredDays: number`, `dayTotalsMl: readonly number[]` (one total per registered day) and
  `firstHours: readonly number[]` (per registered day, the earliest São Paulo hour of a live register) and
  `currentStreak: number` (`streakOf(registered days, today).days`, so yesterday's run still counts while today
  is empty); `unlockFacts` takes `today: DayKey = dayKey(new Date())` as a third parameter.
  `type Progress = { current: number; target: number }`;
  `unlockProgress(u: Unlock, f: UnlockFacts): Progress | null` (`null` for `starter` and the old boolean kinds;
  `current` capped at `target`; volumes in ml, so the UI formats them; `streak` progress is the **current** run —
  spec §5.2 — while `meets` keeps reading the longest run ever).

- [ ] **Step 1: Write the failing tests** (build entries with explicit UTC `drank_at`):
  - `mornings {before 9, days 5}`: five different days with a register at 08:59 São Paulo (`11:59Z`) meet; a
    register at 09:00 São Paulo does not count; a register at `02:30Z` (23:30 the previous evening in São Paulo)
    counts for the previous day, not as a morning.
  - `goalDays {ml 2000, days 10}`: ten days whose totals reach exactly 2000 meet; a deleted register does not count
    toward a day's total; a day reaching 2000 only in UTC-day terms but split across two São Paulo days does not.
  - `days {days 60}`: counts distinct São Paulo days with a live register.
  - `record {ml 3500}`: a best day of exactly 3500 meets.
  - `unlockProgress`: a current run of 12 (longest ever 20) toward 30 → `{ current: 12, target: 30 }`; with today
    empty and a run of 5 ending yesterday → 5; volume 84 L of 250 L →
    `{ current: 84000, target: 250000 }`; a value past the target is capped; `starter` → `null`.
  - The pacing fixture (spec §9), a reusable generator in `src/features/fish/regularUser.fixture.ts`: a synthetic
    "regular user" over 150 days — a register-free day every tenth day (days 10, 20, 30 …) except none between days
    41 and 75; on registered days four registers totalling a seeded 1800–2600 ml, the first at 08:00 São Paulo on
    even days and 10:00 on odd days; one 3 600 ml day on day 38. Assert the facts it produces on day 1 and day 140
    (registered days, longest streak, morning days, goal days at 2000 ml, registers, total ml), derived from the
    generator's rules.
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement** the facts (one pass over the entries, `dayTotals` for totals, `hourOf` for hours) and
  `unlockProgress`.
- [ ] **Step 4: Run, all pass**; typecheck.
- [ ] **Step 5: Commit** `feat(fish): morning-days, goal-days and day-count achievements with progress`

### Task 9: The new roster

**Precondition:** every fish art file exists in `.tmp/m10/fish/`: `pintado, dourado, tucunare, pirarucu, tuna,
barracuda, swordfish, mahimahi, grouper, pufferfish, shark, clownfish, goldfish, guppy, betta, neon, whale`. The
orchestrator confirms this before dispatching.

**Files:**
- Create: `src/features/fish/svg/{pintado,dourado,tucunare,pirarucu,tuna,barracuda,swordfish,mahimahi,grouper}.ts`
- Replace: `src/features/fish/svg/{pufferfish,shark,clownfish,goldfish,guppy,betta,neon,whale}.ts`
- Delete: `src/features/fish/svg/{octopus,seahorse,turtle,dolphin}.ts`
- Modify: `src/features/fish/svg/index.ts`, `src/features/fish/catalog.ts`, `src/features/fish/catalog.test.ts`,
  `src/features/fish/Fish.test.tsx`, `src/features/fish/unlocks.ts` (drop `bottle`, `note`, `morning`),
  `src/features/fish/unlocks.test.ts`, `src/lib/strings.ts`, `src/features/celebrations/dayState.test.ts`,
  `src/features/celebrations/CelebrationProvider.test.tsx`, `scripts/fish-sheet.mjs` (WebKit → Chromium)

**Interfaces:**
- Produces: `FISH_IDS` in this exact order: `guppy, betta, goldfish, neon, clownfish, pufferfish, tucunare,
  tambaqui, dourado, barracuda, mahimahi, grouper, pintado, pirarucu, tuna, swordfish, shark, whale`;
  `UNLOCKS` exactly as the spec's §3 table (`clownfish {streak 3}`, `pufferfish {mornings before 9, days 5}`,
  `tucunare {streak 7}`, `tambaqui {goalDays 2000, 10}`, `dourado {count 100}`, `barracuda {streak 14}`,
  `mahimahi {record 3500}`, `grouper {volume 100000}`, `pintado {days 60}`, `pirarucu {streak 30}`,
  `tuna {goalDays 2000, 45}`, `swordfish {count 400}`, `shark {volume 200000}`, `whale {days 120}`);
  `HABITAT`: `fresh` for guppy, betta, goldfish, neon, tucunare, tambaqui, dourado, pintado, pirarucu, the other nine
  `salt`; `fishOf` maps `seahorse→barracuda`, `octopus→swordfish`, `turtle→mahimahi`, `dolphin→grouper`, other
  unknowns → `guppy`; `STREAK_MILESTONES` becomes `[3, 7, 14, 30]` (derived, unchanged code).
- Strings (`STRINGS.peixes`): names `goldfish: 'Kinguio'`, `pintado: 'Pintado'`, `dourado: 'Dourado'`,
  `tucunare: 'Tucunaré'`, `pirarucu: 'Pirarucu'`, `tuna: 'Atum'`, `barracuda: 'Barracuda'`, `swordfish: 'Espadarte'`,
  `mahimahi: 'Mahi-mahi'`, `grouper: 'Garoupa'` (the others unchanged); labels
  `antesDasEmDias: (hora, dias) => \`Antes das ${hora}h em ${dias} dias\``,
  `diasCom: (dias, volume) => \`${dias} dias com ${volume}\``, `diasComRegistro: (dias) => \`${dias} dias com registro\``,
  `umDiaCom: (volume) => \`Um dia com ${volume}\`` (replacing `umDiaAcimaDe`); `registros`, `acumulados`,
  `sequenciaDias`, `inicial` stay; `registreComGarrafa`, `registreComNota`, `registreAntesDas` go.

- [ ] **Step 1: Copy the art** — each `.tmp/m10/fish/<id>.ts` into `src/features/fish/svg/<id>.ts`, changing only
  the imports to `./helpers` and `./types`. Do not change a coordinate or a colour.
- [ ] **Step 2: Update the tests first** — catalog: 18 ids in the order above, four starters, `ALL_FISH_AVAILABLE`
  false, the exact `UNLOCKS`, the labels (`'Antes das 9h em 5 dias'`, `'10 dias com 2 L'`, `'Um dia com 3,5 L'`,
  `'100 L acumulados'`, `'60 dias com registro'`, `'Sequência de 30 dias'`, `'400 registros'`), names incl.
  `'Kinguio'`/`'Espadarte'`/`'Mahi-mahi'`, habitats, `STREAK_MILESTONES` `[3, 7, 14, 30]`, `fishOf` aliases;
  Fish.test's existing box/state tests now cover 18 ids; unlocks, with the Task 8 pacing fixture: only the four
  starters on days 1 and 2; at most three fish besides the starters by day 10; the whale not before day 100 and every
  fish by day 150; celebrations fixtures renamed to the new ids with the same meaning.
- [ ] **Step 3: Run, see them fail.**
- [ ] **Step 4: Implement** the catalog, `index.ts`, strings, the removal of the old kinds and old art files,
  and the fish-sheet script's engine.
- [ ] **Step 5: Run all tests; typecheck; build;** `npm run fish:sheet` and Read `.tmp/fish-sheet.png`: all 18
  render, none clipped.
- [ ] **Step 6: Commit** `feat(fish): eighteen fish, nine river and nine sea, on a four-month ladder`

### Task 10: Progress and the collection in the gallery

**Files:**
- Modify: `src/features/fish/FishGrid.tsx`, `src/features/fish/FishGrid.test.tsx`, `src/screens/perfil/FishGallery.tsx`,
  `src/lib/strings.ts`

**Interfaces:**
- Consumes: `unlockFacts`, `unlockProgress`, `Progress` (Task 8), `UNLOCKS`, `FISH_IDS`.
- Produces: `FishGrid` gains an optional prop `progress?: (id: FishId) => Progress | null`; strings
  `progressoDe: (atual: string, alvo: string) => \`${atual} de ${alvo}\`` and
  `colecao: (n: number, total: number) => \`${n} de ${total} peixes\``.

Formatting: `volume` kinds show whole litres (`Math.floor(ml/1000)` and the target in litres, e.g. "84 de 250");
`record` shows litres with one decimal comma ("2,8 de 3,5"); every other kind whole numbers. Markup under the
existing achievement label of a locked fish: the text (same style as the label but not uppercase, `text-ink-2`,
11 px, tabular numbers) and a 4 px bar: track `bg-line`, fill `bg-water`, `rounded-full`, width = current/target,
`role="progressbar"` with `aria-valuenow/min/max` and `aria-label` = the achievement label. The collection line
("9 de 18 peixes", 12 px, `text-ink-2`) sits above the grid inside the open gallery. The worn fish counts as owned.
Onboarding passes no `progress`, so it renders exactly as today.

- [ ] **Step 1: Write the failing tests** — a locked `pirarucu` with a current run of 12 shows "12 de 30" and a
  progressbar with `aria-valuenow` 12 and max 30; a locked `shark` with 84,5 L shows "84 de 200"; a locked
  `mahimahi` with a best day of 2,8 L shows "2,8 de 3,5"; an unlocked fish shows no progress; the onboarding grid
  (no `progress` prop) shows none; FishGallery open shows "N de 18 peixes" counting the worn fish (wearing a
  dropped id such as `dolphin` counts `grouper` as owned).
- [ ] **Step 2: Run, see them fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all; typecheck.**
- [ ] **Step 5: Commit** `feat(fish): progress toward every locked fish and the collection count`

### Task 11: Docs and version

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (§5.5 progress and count; §6 the new roster table,
  the kinds, the ladder, the re-lock note and the aliases, "eighteen fish"; §7 milestones 3/7/14/30),
  `docs/superpowers/specs/2026-10-20-m10-aquario-design.md` §3.1 (the habitat list from the fish spec),
  `docs/superpowers/specs/2026-10-22-m10-peixes-conquistas-design.md` (status: built), `docs/superpowers/plans/ROADMAP.md`
  (M10 row: built on `m10`, not merged; the phone checks Leo owes: the tubes at several litres, the switch, the gallery
  progress, the new fish), `README.md` (only if it lists the fish), `package.json` version `1.4.0`.

- [ ] **Step 1:** make the edits; `npm run test:run`, `npm run typecheck`, `npm run build`.
- [ ] **Step 2: Commit** `docs: M10 built — aquarium, eighteen fish, the four-month ladder`
