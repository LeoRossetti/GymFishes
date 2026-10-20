# M9b — Polimento pós-auditoria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the ten owner-approved polish items from the post-M9 audits: instant press feedback, a primary button that never shifts layout, honest counting numbers, a sheet that closes on a flick and respects reduced motion, long-press and press-state fixes, Ranking with long names, no crest on an empty tube, two small bugs, the fish riding the water, and small polish.

**Architecture:** Every change is local to the component that owns it. No new module, mechanism, option or screen. One global CSS rule for press timing; one pure helper for the sheet's close decision so it can be unit-tested.

**Tech Stack:** React 19, TypeScript strict, Tailwind v4 tokens, `motion`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-20-m9-fechamento-design.md` §5 (the ten items, binding) and the parent spec `docs/superpowers/specs/2026-08-11-gymfishes-design.md` §8.

## Global Constraints

- pt-BR only; every user-visible string lives in `src/lib/strings.ts`; no new strings are expected here.
- Colours only via tokens; flat UI; no new animation, pulse, glow or shadow; no new mechanism, option or screen.
- Touch targets ≥ 44px. Tests are behavioural (roles, texts, attributes), never class names; CSS-only changes need no test but must keep the suite green.
- `npm run typecheck` and `npm run test:run` green before every commit. Files under ~200 lines.
- Branch `m9-fechamento`; commit by path; never `git add -A`. Supabase is unreachable: never run `npm run e2e`.
- The red `danger` button variant does not change.

## Review Focus

1. Pressing the primary button at the end of a scrolled sheet must not move the keypad (item 2): pinned by reading in Task 1 that the pressed box equals the resting box (`border-b-0` + `mb-1` = `border-b-4`), confirmed by eye in Task 4's screenshot.
2. Three fast taps on +250 must count 250 → 500 → 750 without going backwards (item 3): pinned in Task 2 by the `useCountUp` test that retargets mid-animation and asserts the new animation starts from the shown value.
3. A fast short flick must close the sheet, a slow short drag must not (item 4): pinned in Task 2 by the pure helper's tests.
4. A tube at 0 ml draws no crest, a tube at 500 ml draws water and fish (items 7, 9): pinned in Task 3 by the MemberTube tests.
5. Reopening the sheet right after saving must give a working confirm button (item 4): pinned in Task 2 by the AppShell test that asserts a new dialog instance after close and reopen.

---

### Task 1: Press feedback, button boxes, long-press, press states, rounded highlights

**Files:**
- Modify: `src/styles/globals.css` (after the `button { touch-action }` rule)
- Modify: `src/ui/Button.tsx:12-15` (primary variant)
- Modify: `src/app/TabBar.tsx:49-50` (floating plus)
- Modify: `src/screens/registrar/OptionalChips.tsx:18` (`CHIP`), `:24-40` (`RemoveBadge`)
- Modify: `src/screens/registrar/BottleGrid.tsx:47-60` (the ×qty badge)
- Modify: `src/ui/Stepper.tsx:10-12` (`ARROW`)
- Modify: `src/screens/hoje/EntryRow.tsx:42` (row button)
- Modify: `src/screens/registrar/RegisterSheet.tsx:88` (sheet scroller className)
- Test: existing suites only (CSS-only task)

- [ ] **Step 1: globals.css** — after the `button { touch-action: manipulation; }` rule add two rules with one-line comments:
  - `:is(button, a):active { transition-duration: 0ms; }` (a press lands on the first frame; release keeps each control's own fade)
  - `button, nav a { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }` (no text selection on keys, no iOS link callout on the tabs)

- [ ] **Step 2: Button primary** — replace the primary variant with: `'bg-water text-ink-on-water border-b-4 border-water-edge active:translate-y-[3px] active:border-b-0 active:mb-1 disabled:bg-surface-2 disabled:text-ink-2 disabled:border-surface-2 disabled:translate-y-0'` (drop `transition-transform`; disabled keeps the 4px edge in the surface colour, so the box never changes height). Update the comment above `VARIANTS` if it describes the edge.

- [ ] **Step 3: TabBar plus** — remove `transition-transform` from the plus button's className (the drop is instant; `active:translate-y-[2px] active:border-b-0` stay).

- [ ] **Step 4: Chips and badges** — `OptionalChips.tsx`: `CHIP` gains `active:bg-line transition-colors duration-100`. `RemoveBadge`: the button gets `group` and loses `active:bg-line transition-colors duration-100`; its inner span gains `group-active:bg-water-edge transition-colors duration-100`. `BottleGrid.tsx` ×qty badge: the button gets `group`; the span's `active:bg-water-edge` becomes `group-active:bg-water-edge`.

- [ ] **Step 5: Rounded highlights and overscroll** — `Stepper.tsx` `ARROW` gains `rounded-control`; `EntryRow.tsx` row button gains `rounded-control`; `RegisterSheet.tsx` scroller className gains `overscroll-contain`.

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run test:run`
Expected: green (no test asserts these classes).

- [ ] **Step 7: Commit**

```bash
git add src/styles/globals.css src/ui/Button.tsx src/app/TabBar.tsx src/screens/registrar/OptionalChips.tsx src/screens/registrar/BottleGrid.tsx src/ui/Stepper.tsx src/screens/hoje/EntryRow.tsx src/screens/registrar/RegisterSheet.tsx
git commit -m "polish(ui): instant press, steady button box, no long-press callout, press on the visible badge, rounded highlights"
```

---

### Task 2: Counting numbers and the sheet's close, reduced motion and instance

**Files:**
- Modify: `src/ui/useCountUp.ts`
- Create: `src/screens/registrar/sheetGesture.ts` (pure helper) and `src/screens/registrar/sheetGesture.test.ts`
- Modify: `src/screens/registrar/RegisterSheet.tsx:48,73-84,102-104`
- Modify: `src/screens/hoje/MemberTube.tsx:84-86` (total `<p>`), `src/features/celebrations/CelebrationScreen.tsx` (`Record` `<p>`)
- Modify: `src/app/AppShell.tsx:26,41,48,50`
- Test: `src/ui/useCountUp.test.ts` (create if absent), `src/screens/registrar/RegisterSheet.test.tsx`, `src/app/AppShell.test.tsx`

**Interfaces:**
- Produces: `shouldCloseSheet(offsetY: number, velocityY: number): boolean` in `sheetGesture.ts` — true when `offsetY > 80 || velocityY > 500`.
- Produces: the shell's sheet state becomes `{ entry?: Entry; id: number }` with a counter, and `<RegisterSheet key={sheet.id} …/>`.

- [ ] **Step 1: Failing tests**

`sheetGesture.test.ts`:
```ts
it('closes on a long drag or a fast flick, not on a slow short drag', () => {
  expect(shouldCloseSheet(81, 0)).toBe(true)
  expect(shouldCloseSheet(40, 600)).toBe(true)
  expect(shouldCloseSheet(40, 100)).toBe(false)
})
```

`useCountUp.test.ts` (use `vi.mock('motion', …)` to capture the `animate(from, to, opts)` call and drive `opts.onUpdate`; `matchMedia` must report no reduced motion, stub it):
```ts
it('a retarget mid-count starts from the number on screen, not the previous target', () => {
  // render with value 250 (from 0); drive onUpdate(120); rerender with 500;
  // assert the second animate() call's `from` is 120, not 250
})
```

`RegisterSheet.test.tsx`: `it('the running total echoes the typed digits immediately', …)` — tap "+250" and assert `getAllByText('250 ml')` is present synchronously (no `await`/`findBy`), with the count the file already uses for that text.

`AppShell.test.tsx`: `it('reopening the sheet gives a fresh dialog instance', …)` — open via "Registrar água", keep a reference to `getByRole('dialog', { name: 'Registrar água' })`, close it via its "Fechar" button, open again, assert the new dialog node is not the same object. (With `AnimatePresence` the old node may linger in jsdom; use `getAllByRole` and compare the last one.)

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/screens/registrar/sheetGesture.test.ts src/ui/useCountUp.test.ts src/screens/registrar/RegisterSheet.test.tsx src/app/AppShell.test.tsx`
Expected: FAIL (helper missing; `from` is 250; total arrives late; same dialog node).

- [ ] **Step 3: Implement**

- `useCountUp.ts`: add `const shownRef = useRef(from)`; `onUpdate` sets `shownRef.current = Math.round(v)` and the snap branch sets it too; `const start = shownRef.current` (delete `prev`); `ease: [0.23, 1, 0.32, 1]`. Update the doc comment.
- `sheetGesture.ts`: the helper above with a one-line doc comment (a flick is intent).
- `RegisterSheet.tsx`: `onDragEnd={(_e, info) => { if (shouldCloseSheet(info.offset.y, info.velocity.y)) onClose() }}`; `const reduced = useReducedMotion() ?? false`; `initial={reduced ? { opacity: 0 } : { y: '100%' }}`, `animate={{ y: 0, opacity: 1 }}`, `exit={reduced ? { opacity: 0 } : { y: '100%' }}`, `transition={reduced ? { duration: 0.12 } : { type: 'spring', duration: 0.28, bounce: 0.15 }}`; the running total uses `formatVolume(total)` directly (delete the `useCountUp` import and call); the total `<p>` gains `tabular-nums`.
- `MemberTube.tsx` total `<p>` and `CelebrationScreen.tsx` `Record` `<p>`: add `tabular-nums`.
- `AppShell.tsx`: `useState<{ entry?: Entry; id: number } | null>`, a `useRef(0)` counter, `setSheet({ entry, id: ++counter.current })` in both openers, `<RegisterSheet key={sheet.id} …/>`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run test:run`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/ui/useCountUp.ts src/ui/useCountUp.test.ts src/screens/registrar src/screens/hoje/MemberTube.tsx src/features/celebrations/CelebrationScreen.tsx src/app/AppShell.tsx src/app/AppShell.test.tsx
git commit -m "polish(motion): count-up never jumps back, typed digits echo instantly, flick closes the sheet, reduced-motion crossfade, fresh sheet instance"
```

---

### Task 3: Tubes, Ranking with long names, Perfil rows, fades, reduced-motion scroll

**Files:**
- Modify: `src/screens/hoje/MemberTube.tsx:25-35,48-55,58-82`; delete `src/screens/hoje/MemberTube.test.ts` (it only tests `fishBottomPx`)
- Modify: `src/screens/ranking/Standings.tsx:36-46`, `src/screens/ranking/StatsCompare.tsx:44-47,58-60`
- Modify: `src/screens/perfil/BottleManager.tsx:60-61`
- Modify: `src/screens/historico/DayDetail.tsx:30`
- Modify: `src/features/celebrations/CelebrationScreen.tsx:44` (fade), `src/features/pwa/UpdatePrompt.tsx` (its enter transition)
- Test: `src/screens/hoje/MemberTube.test.tsx`, `src/screens/ranking/Standings.test.tsx`

- [ ] **Step 1: Failing tests**

`MemberTube.test.tsx`:
```tsx
it('an empty tube draws no water and no crest', () => {
  const { container } = render(<MemberTube {...base} totalMl={0} />)
  expect(container.querySelector('svg[data-fish]')).toBeNull()
  expect(container.querySelector('.wave-front, .wave-back')).toBeNull()   // the WaveSurface classes
})
```
(Check `WaveSurface.tsx` for the class names it renders and use those.) The existing 250/500 ml tests stay.

`Standings.test.tsx`: a 20-character name renders in full: `expect(screen.getByText('Maria Clara Figueira')).toBeInTheDocument()` with a member fixture of that name (today it is truncated by CSS only, so this test passes before and after; keep it as the guard that the name is never shortened in the DOM, and say so in a comment).

- [ ] **Step 2: Run to verify the tube test fails**

Run: `npx vitest run src/screens/hoje/MemberTube.test.tsx`
Expected: FAIL (crest present at 0 ml).

- [ ] **Step 3: Implement**

- `MemberTube.tsx`: wrap the water `motion.div` in `{totalMl > 0 ? … : null}`; move the fish `motion.span` inside the water `motion.div`, after the wave span, as `<span aria-hidden className="absolute left-1/2 top-[6px] -translate-x-1/2">` (plain span: it rides the parent's height spring; no `animate`/`transition`; keep the `(pct / 100) * TUBE_H >= FISH_H` condition around it); delete `fishBottomPx`, `GAP` and their comment; keep `TUBE_H`, `FISH_W`, `FISH_H` exports; splash effect: `if (!grew || reduced) { setSplash(false); return }`. Delete `MemberTube.test.ts`.
- `Standings.tsx`: name span `w-24 shrink-0 text-[13px] font-extrabold leading-tight break-words` (drop `truncate`); total span gains `min-w-[4.5rem] text-right tabular-nums`.
- `StatsCompare.tsx`: `<th scope="col">` gains `pl-3`; value `<td>` gains `whitespace-nowrap`.
- `BottleManager.tsx`: `<span className="w-6 shrink-0 text-center">{bottle.emoji ?? ''}</span>` always rendered; name span gains `min-w-0`.
- `DayDetail.tsx`: `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'` (guard `typeof matchMedia === 'function'`).
- `CelebrationScreen.tsx` fade: `{ duration: reduced ? 0.12 : 0.25, ease: 'easeOut' }`; `UpdatePrompt.tsx`: add `ease: 'easeOut'` to its enter transition (find it).

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run test:run`
Expected: green; the deleted test file is gone from the count.

- [ ] **Step 5: Commit**

```bash
git add src/screens/hoje src/screens/ranking src/screens/perfil/BottleManager.tsx src/screens/historico/DayDetail.tsx src/features/celebrations/CelebrationScreen.tsx src/features/pwa/UpdatePrompt.tsx
git commit -m "polish(hoje,ranking): fish rides the water, no crest at 0 ml, names wrap, comparable bars, aligned bottle rows, ease-out fades"
```

---

### Task 4: Docs, screenshots, verification

**Files:**
- Modify: `docs/superpowers/plans/ROADMAP.md` (M9 section: a "Polimento pós-auditoria" paragraph), `docs/superpowers/specs/2026-08-11-gymfishes-design.md` §5.1 (fish rides the water; no crest at 0 ml), §5.2 (flick closes; total echoes digits), §8 Rules (press lands instantly; buttons never shift), §5.3 (names wrap)

- [ ] **Step 1: Docs** — one or two sentences each, marked "(M9b)". ROADMAP: the paragraph lists the ten items in one breath and the audits they came from.

- [ ] **Step 2: Verify** — `npm run typecheck && npm run test:run && npm run build` green.

- [ ] **Step 3: Screenshots** — start `npx vite --port 4175`, use Playwright's bundled Chromium (393×852, dsf 2) with the stand-in `.tmp/review-final/pairs/mock.mjs` (scenarios `worst` in `.tmp/review-final/audits/break/mock.mjs` for the long-name Ranking, `first-cup` for a 250 ml tube, default for the sheet). Capture to `.tmp/review-final/m9b/`: Hoje at 0 ml for the user (no crest), Hoje at 500 ml (fish in the water), Ranking month with "Maria Clara Figueira" (wrapped name, equal bar tracks, spaced headers), the sheet after +250 (total), the sheet with the primary button held down at the end of a scrolled sheet (mouse down, no up: keypad must not move; compare with a shot before the press). Look at each PNG and state what you saw. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add docs
git commit -m "docs: M9b polish folded into the spec and roadmap"
```
