# M9 — Fechamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the owner-approved wrap-up changes: sticky confirm and keyboard behaviour in the register sheet, the fish threshold on Hoje, four removals of repeated information, no toast under a full-screen celebration plus the trophy lead marker, five themes instead of six, the install row in Perfil, a handful of size/accessibility fixes, docs and version 1.3.0.

**Architecture:** Every change is local to the component that owns the behaviour; the only new module is `src/features/pwa/useInstallPrompt.ts`. The celebration engine gains one boolean in its `Presentation`. No schema, no route, no new screen.

**Tech Stack:** React 19, TypeScript strict, Vite 8, Tailwind v4 tokens, `motion`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-20-m9-fechamento-design.md` (decisions) and the parent spec `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (updated in Task 8).

A throwaway worktree at `.tmp/wt-design` (detached, uncommitted) holds a spike of most of these edits; `git -C .tmp/wt-design diff` is a reference for the exact classes, never something to copy blindly. It is removed in Task 8.

## Global Constraints

- pt-BR only; every user-visible string lives in `src/lib/strings.ts`, none in JSX.
- Colours only through tokens in `src/styles/tokens.css` / `src/features/theme/themes.ts`; flat surfaces, 1px lines, solid bottom edge on primary buttons; no gradient, glow, shadow or pulse.
- Touch targets ≥ 44px. Keypad keys become 48px.
- Tests are behavioural: roles and pt-BR texts, never class names, except where a class is the whole deliverable and the step says so.
- `npm run test:run` green before every commit; `npm run typecheck` green.
- Files stay under ~200 lines.
- Supabase is unreachable: never run `npm run e2e` or anything against the cloud.
- Red destructive buttons (`danger` variant) do NOT change. No streak animation.

## Review Focus

1. A phone that stored the theme id `tinta` must open in Fundo do mar, not in a half-styled theme and not crash: pinned in Task 5 by the `readTheme` test with `'tinta'` in storage.
2. A register that earns a full screen AND the lead must show the trophy only on the new-fish screen and must not toast; a lead with no full screen must still toast: pinned in Task 1 (`present` tests and the provider test).
3. Water deeper than the fish but shallower than fish + cushion (480–560 ml) must still draw the fish at the floor: pinned in Task 3 (`MemberTube` at 500 ml).
4. The install hook must not throw where `matchMedia` is missing (jsdom, old WebViews): pinned in Task 6 (hook test without `matchMedia`).
5. The sticky confirm wrapper must keep the safe-area bottom padding so the button never sits under the home indicator: Task 2 moves the padding into the wrapper and the step names the exact value; not unit-testable, checked by eye in Task 8's screenshot step.

---

### Task 0: Branch and commit the pending integrity fixes

**Files:**
- Modify: none (git only)

The working tree on `development` holds uncommitted, owner-approved integrity fixes (auth api, favicon, fish eye constants, tailwind devDependencies, tsconfig flag, spec/README/HANDOFF refresh) plus the new M9 spec and this plan.

- [ ] **Step 1: Create the milestone branch**

Run: `git checkout -b m9-fechamento`

- [ ] **Step 2: Verify the tree is green**

Run: `npm run typecheck && npm run test:run`
Expected: typecheck silent; `Test Files 76 passed`, `Tests 474 passed`.

- [ ] **Step 3: Commit the integrity fixes and the M9 docs**

```bash
git add -A
git commit -m "chore: wrap-up integrity fixes — auth api, favicon, eye tokens, tsconfig, docs refresh; M9 spec and plan"
```

---

### Task 1: Celebrations — no toast under a full screen, trophy lead marker, ring removed

**Files:**
- Modify: `src/features/celebrations/engine.ts:45-60`
- Modify: `src/features/celebrations/CelebrationScreen.tsx`
- Modify: `src/features/celebrations/CelebrationProvider.tsx:59-62,90`
- Modify: `src/lib/strings.ts` (group `celebracoes`)
- Modify: `scripts/celebration-shots.entry.tsx:25-33`
- Test: `src/features/celebrations/engine.test.ts`, `src/features/celebrations/CelebrationScreen.test.tsx`, `src/features/celebrations/CelebrationProvider.test.tsx`

**Interfaces:**
- Produces: `Presentation` gains `lead: boolean` (true when `cels` contains `{ kind: 'lead' }`). `present()` returns `toasts: []` whenever `fullScreen` is not null. `CelebrationScreen` gains the prop `lead?: boolean` (default `false`). New string `STRINGS.celebracoes.naFrente = 'Você está na frente'`.

- [ ] **Step 1: Write the failing engine tests** (replace the expectation at `engine.test.ts:68-78`, add the lead-only case)

```ts
it('shows at most one full screen and drops everything else while it is up', () => {
  const p = present([
    { kind: 'unlock', fish: 'pufferfish' }, { kind: 'record', ml: 4200 },
    { kind: 'streak', days: 7 }, { kind: 'lead' }, { kind: 'litre', litres: 4 },
  ])
  expect(p.fullScreen).toEqual({ kind: 'unlock', fish: 'pufferfish' })
  expect(p.toasts).toEqual([])
  expect(p.lead).toBe(true)
  expect(p.inline).toBeNull()
})

it('a lead with no full screen is still a toast', () => {
  const p = present([{ kind: 'lead' }])
  expect(p.fullScreen).toBeNull()
  expect(p.toasts).toEqual([{ kind: 'lead' }])
  expect(p.lead).toBe(true)
})

it('lead is false when nobody took the lead', () => {
  expect(present([{ kind: 'record', ml: 4200 }]).lead).toBe(false)
})
```

Keep the existing `lead + litre` test at `:84` (toast lead, drop litre) as is.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/celebrations/engine.test.ts`
Expected: FAIL — `toasts` not empty, `lead` undefined.

- [ ] **Step 3: Implement `present()`**

In `engine.ts`: add `lead: boolean` to `Presentation`; compute `const lead = cels.some((c) => c.kind === 'lead')`; `toasts` is `[]` when `fullScreen` is set, otherwise `cels.filter((c) => c.kind === 'lead')`; `inline` unchanged. Update the doc comment: "nothing is drawn under a full screen (M9)".

- [ ] **Step 4: Run engine tests**

Run: `npx vitest run src/features/celebrations/engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing screen tests** (append to `CelebrationScreen.test.tsx`)

```tsx
it('the unlock screen shows the lead trophy when the register also took the lead', () => {
  render(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} lead onClose={vi.fn()} onChoose={vi.fn()} />)
  expect(screen.getByRole('img', { name: 'Você está na frente' })).toBeInTheDocument()
})

it('record and streak screens never show the trophy, and unlock without lead has none', () => {
  const { rerender } = render(<CelebrationScreen celebration={{ kind: 'record', ml: 4200 }} lead onClose={vi.fn()} onChoose={vi.fn()} />)
  expect(screen.queryByRole('img', { name: 'Você está na frente' })).toBeNull()
  rerender(<CelebrationScreen celebration={{ kind: 'unlock', fish: 'pufferfish' }} onClose={vi.fn()} onChoose={vi.fn()} />)
  expect(screen.queryByRole('img', { name: 'Você está na frente' })).toBeNull()
})
```

Use the file's existing render helper/providers if it has one (`MemoryRouter`/`ToastProvider` are not needed by this component).

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/features/celebrations/CelebrationScreen.test.tsx`
Expected: FAIL — no element with role img.

- [ ] **Step 7: Implement the screen**

In `strings.ts` group `celebracoes` add `naFrente: 'Você está na frente'`. In `CelebrationScreen.tsx`: add `lead?: boolean` to `Props` (default `false`); delete the ring `motion.span` in `Unlock` (the `h-44 w-44 rounded-full border-2 border-streak` block) and the "behind one flat ring" wording in its comment; when `lead && celebration.kind === 'unlock'` render, before the body `motion.div`:

```tsx
<motion.span
  role="img"
  aria-label={STRINGS.celebracoes.naFrente}
  className="mb-4 text-streak"
  initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
  animate={{ scale: 1, opacity: 1, rotate: 0 }}
  transition={reduced ? { duration: 0.12 } : { type: 'spring', duration: 0.7, bounce: 0.4, delay: 0.45 }}
>
  <Trophy size={44} filled strokeWidth={2.2} />
</motion.span>
```

`Trophy` comes from `@/ui/icons`. Update the component's doc comment (no ring; the trophy marks the lead on the unlock screen, spec M9).

- [ ] **Step 8: Run screen tests**

Run: `npx vitest run src/features/celebrations/CelebrationScreen.test.tsx`
Expected: PASS (the existing unlock test still passes; it never asserted the ring).

- [ ] **Step 9: Update the provider test** at `CelebrationProvider.test.tsx:117-123`: the streak no longer becomes a toast under the unlock. Replace the toast assertions with: the dialog is the unlock screen and there is no element with role `status` whose text includes `'🔥 7 dias seguidos!'`. Add one test: a register that unlocks a fish and takes the lead renders the dialog containing `getByRole('img', { name: 'Você está na frente' })` and no toast (build the before/after `DayState` the way the file's other tests do, with `leading: false → true`).

- [ ] **Step 10: Run to verify the new provider test fails**

Run: `npx vitest run src/features/celebrations/CelebrationProvider.test.tsx`
Expected: FAIL — trophy not rendered (the `lead` prop is not passed yet).

- [ ] **Step 11: Wire the provider**

In `CelebrationProvider.tsx`: keep `shown.lead` alongside the full screen (e.g. `setFull({ celebration: shown.fullScreen, lead: shown.lead })` or a second state), and render `<CelebrationScreen celebration={…} lead={…} …/>`. The toast call stays as is (it only fires when `toasts.length > 0`, which is now never under a full screen).

- [ ] **Step 12: Update the shots entry**

`scripts/celebration-shots.entry.tsx`: read `lead` from the query (`params.get('lead') === '1'`) and pass `lead={lead}` to `CelebrationScreen`, so `npm run celebration:shots` can record the trophy later.

- [ ] **Step 13: Run the whole suite and typecheck**

Run: `npm run typecheck && npm run test:run`
Expected: all green.

- [ ] **Step 14: Commit**

```bash
git add src/features/celebrations src/lib/strings.ts scripts/celebration-shots.entry.tsx
git commit -m "feat(celebrations): nothing toasts under a full screen; trophy marks the lead on the unlock screen; ring removed"
```

---

### Task 2: Register sheet — sticky confirm, unit case, focus and Escape, loose line, keypad, tile border

**Files:**
- Modify: `src/screens/registrar/RegisterSheet.tsx:69-130`
- Modify: `src/screens/registrar/LooseAmount.tsx`
- Modify: `src/screens/registrar/BottleGrid.tsx:34-38`
- Modify: `src/lib/strings.ts` (group `registrar`: `registrar(volume)` becomes unused — delete it)
- Test: `src/screens/registrar/RegisterSheet.test.tsx`, `src/screens/registrar/LooseAmount.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: the sheet's confirm label is `"Registrar"` + `" "` + `<span class="normal-case">{formatVolume(total)}</span>`; its accessible name stays `Registrar 500 ml` (existing tests rely on it).

- [ ] **Step 1: Write the failing sheet tests** (append to `RegisterSheet.test.tsx`, using the file's own `renderSheet`/setup helpers)

```tsx
it('moves focus to the handle on open and closes on Escape', async () => {
  const onClose = vi.fn()
  renderSheet({ onClose })            // adapt to the file's helper
  expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(1)
})

it('shows the typed loose amount once, in the running total', async () => {
  renderSheet()
  await userEvent.click(screen.getByRole('button', { name: '+250' }))
  expect(screen.getAllByText('250 ml')).toHaveLength(1)
})
```

If `LooseAmount.test.tsx` asserts the blue line (`text-water` paragraph or a second `250 ml`), change that assertion to expect it absent.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/screens/registrar`
Expected: FAIL — focus on the plus / no close on Escape; two `250 ml` texts.

- [ ] **Step 3: Implement the sheet**

In `RegisterSheet.tsx`:
- the handle button gets `autoFocus` (it is already the accessible "Fechar");
- the dialog element gets `onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}`;
- remove the dialog's inline `paddingBottom` style; wrap the confirm `Button` and the cap line in `<div className="sticky bottom-0 -mx-3 mt-5 bg-surface px-3 pt-2" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>`;
- the label: `entry ? salvarAlteracoes : total > 0 ? <>{STRINGS.registrar.registrarVazio} <span className="normal-case">{formatVolume(total)}</span></> : registrarVazio`;
- delete `STRINGS.registrar.registrar` from `strings.ts` (grep confirms no other use).

In `LooseAmount.tsx`: delete the `draft.loose > 0` paragraph and the now-unused `formatVolume` import (keep the `draft` prop in the signature only if something else reads it; otherwise drop it from the destructuring, keeping the type); keypad keys `min-h-[48px]` and `text-[20px] font-extrabold`.

In `BottleGrid.tsx:37`: tile classes `border-2 p-[7px]` instead of `border p-2`, both states.

- [ ] **Step 4: Run the sheet tests, then the suite**

Run: `npx vitest run src/screens/registrar && npm run test:run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/registrar src/lib/strings.ts
git commit -m "feat(registrar): sticky confirm, Escape and focus, unit case kept, loose line removed, 48px keys, 2px selected tile"
```

---

### Task 3: Hoje — fish threshold, loose-only rows, chip name, sync pill, toast width

**Files:**
- Modify: `src/screens/hoje/MemberTube.tsx:72`
- Modify: `src/screens/hoje/EntryRow.tsx:22-27,94-108`
- Modify: `src/screens/hoje/RegistersCard.tsx:28-37`
- Modify: `src/screens/hoje/SyncPill.tsx`
- Modify: `src/ui/Toast.tsx:21-27`
- Modify: `src/lib/strings.ts` (`sync.desatualizado`)
- Test: `src/screens/hoje/MemberTube.test.tsx`, `src/screens/hoje/EntryRow.test.tsx`, `src/screens/hoje/SyncPill.test.tsx`, `src/screens/hoje/Hoje.test.tsx` (chip)

**Interfaces:**
- Consumes: `TUBE_H`, `FISH_H` exported by `MemberTube.tsx`.

- [ ] **Step 1: Write the failing tests**

`MemberTube.test.tsx` (scale 3000, base props as in the file):
```tsx
it('draws no fish while the water is shallower than the fish', () => {
  const { container } = render(<MemberTube {...base} totalMl={250} />)
  expect(container.querySelector('svg[data-fish]')).toBeNull()
})
it('draws the fish as soon as the water covers it', () => {
  const { container } = render(<MemberTube {...base} totalMl={500} />)
  expect(container.querySelector('svg[data-fish="betta"]')).not.toBeNull()
})
```

`EntryRow.test.tsx` (build a loose-only entry: `composition: [{ kind: 'loose', amount_ml: 600 }]`, `note: null`, `total_ml: 600`):
```tsx
it('a loose-only register shows its amount once and no chips when expanded', async () => {
  render(<EntryRow {...own} entry={looseOnly} />)
  expect(screen.getAllByText('600 ml')).toHaveLength(1)
  await userEvent.click(screen.getByRole('button', { expanded: false }))
  expect(screen.queryByText('+ 600 ml')).toBeNull()
})
```
(Check `compositionChips` in `src/lib/composition.ts` for the exact chip text of a loose item and use it.)

`SyncPill.test.tsx:23-27`: rename to `'shows Pode estar desatualizado when stale'`, assert `screen.getByRole('status')` has text `'Pode estar desatualizado'`.

`Hoje.test.tsx`: in the test that renders a streak, assert `screen.getByLabelText('Sequência de 12 dias')` (use the day count that test produces).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/screens/hoje`
Expected: FAIL on the four new assertions.

- [ ] **Step 3: Implement**

- `MemberTube.tsx:72`: condition `(pct / 100) * TUBE_H >= FISH_H` instead of `totalMl > 0`; update the `fishBottomPx` comment ("drawn only once the water covers it, M9").
- `EntryRow.tsx`: `const hasBottle = items.some((i) => i.kind === 'bottle')`; `subtitle = entry.note ?? (hasBottle ? describeComposition(items) : null)`; `const singleLoose = items.length === 1 && items[0]?.kind === 'loose'`; render the chips `div` only when `!singleLoose`.
- `RegistersCard.tsx`: the chip `span` gets `aria-label={STRINGS.peixes.sequenciaDias(streak.days)}`.
- `SyncPill.tsx`: `role="status"` on the span; `strings.ts` `sync.desatualizado: 'Pode estar desatualizado'`.
- `Toast.tsx`: add `w-max max-w-[calc(100%-32px)] text-center` to the toast `div`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/screens/hoje src/ui && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/hoje src/ui/Toast.tsx src/lib/strings.ts
git commit -m "feat(hoje): fish waits for water that covers it; loose-only rows say the amount once; chip and pill announce themselves"
```

---

### Task 4: Ranking, Histórico and controls

**Files:**
- Modify: `src/screens/ranking/Ranking.tsx:40`
- Modify: `src/screens/ranking/MonthWrapUp.tsx:56-61`
- Modify: `src/screens/historico/CalendarGrid.tsx:39`
- Modify: `src/ui/Segmented.tsx:22`
- Modify: `src/app/TabBar.tsx:49-50`
- Modify: `src/ui/Field.tsx:21-22`, `src/screens/registrar/OptionalChips.tsx:125-126,136-137`
- Test: `src/screens/ranking/Ranking.test.tsx`

- [ ] **Step 1: Write the failing Ranking tests**

```tsx
it('hides the comparison card on the day period', () => {
  renderRanking()                                  // the file's helper, default period = today
  expect(screen.queryByText('Médias e recordes')).toBeNull()
})
it('hides the comparison card on an empty period', async () => {
  renderRanking()
  await userEvent.click(screen.getByRole('button', { name: 'Semana' }))
  // step back to a week with no registers using the ‹ control, as the file's "steps back" test does
  …
  expect(screen.queryByText('Médias e recordes')).toBeNull()
})
```
Adjust the existing test at `:103` ("shows the July wrap-up and the comparison card") so the card assertion is made on the month period, where it still renders.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/screens/ranking/Ranking.test.tsx`
Expected: FAIL — card present on the day period.

- [ ] **Step 3: Implement**

- `Ranking.tsx:40`: `{shown.kind !== 'day' && rows.some((r) => r.ml > 0) ? <StatsCompare … /> : null}` (confirm the period object's kind field name in `src/lib/periods.ts`).
- `MonthWrapUp.tsx`: import `Close` from `@/ui/icons`; the close button renders `<Close size={20} />` with classes `-mr-2 -mt-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-ink-2`; its `aria-label` ("Fechar") stays.
- `CalendarGrid.tsx:39`: today's ring `border border-ink`.
- `Segmented.tsx:22`: `text-[15px]`.
- `TabBar.tsx:49-50`: replace `active:bg-water-edge transition-colors duration-100` with `transition-transform active:translate-y-[2px] active:border-b-0`.
- `Field.tsx`, `OptionalChips.tsx`: delete `focus:border-water` from the three inputs.

- [ ] **Step 4: Run the suite and typecheck**

Run: `npm run typecheck && npm run test:run`
Expected: PASS (`MonthWrapUp.test` still finds the button by name "Fechar").

- [ ] **Step 5: Commit**

```bash
git add src/screens/ranking src/screens/historico src/ui src/app/TabBar.tsx src/screens/registrar/OptionalChips.tsx
git commit -m "feat(ranking,histórico,ui): comparison card only when it adds something; close icon; ink ring today; 15px segments; plus presses down; one focus ring"
```

---

### Task 5: Themes — Tinta removed, Breu surface lifted

**Files:**
- Modify: `src/features/theme/themes.ts:1-2,27-31,47`
- Modify: `src/styles/tokens.css:3,36-48,92`
- Modify: `src/lib/strings.ts` (`tema.nomes.tinta` removed)
- Test: `src/features/theme/theme.test.ts:53-57`, `src/features/theme/ThemePicker.test.tsx:16`, `src/features/theme/tokens.test.ts`, `src/lib/contrast.test.ts`

- [ ] **Step 1: Update the failing tests**

- `ThemePicker.test.tsx:16`: names `['Fundo do mar', 'Aquário', 'Meia-noite', 'Areia', 'Breu']`.
- `theme.test.ts:53-57`: use `'aquario'` where it used `'tinta'`.
- Add to `theme.test.ts`:
```ts
it('a stored id that no longer exists falls back to the default theme', () => {
  localStorage.setItem('gymfishes:theme', 'tinta')
  expect(readTheme()).toBe('fundo-do-mar')      // use the file's read function name
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/theme`
Expected: FAIL — six names rendered; `tinta` still a valid id.

- [ ] **Step 3: Implement**

`themes.ts`: `THEME_IDS` without `'tinta'`; delete the `tinta` token set; comment "Five dark themes"; Breu `surface: '#1B1E24'`. `tokens.css`: delete the `html[data-theme='tinta']` block; Breu `--color-surface: #1B1E24`; header comment "the other four". `strings.ts`: remove `tema.nomes.tinta`. `theme.ts` already validates ids with `isThemeId`; confirm `readTheme` returns `DEFAULT_THEME` for unknown values (it should; if not, make it).

- [ ] **Step 4: Run theme, contrast and token tests, then the suite**

Run: `npx vitest run src/features/theme src/lib/contrast.test.ts && npm run test:run`
Expected: PASS, including the token parity test and the contrast audit for Breu's new surface.

- [ ] **Step 5: Commit**

```bash
git add src/features/theme src/styles/tokens.css src/lib/strings.ts
git commit -m "feat(theme): five themes — Tinta removed, Breu cards lifted off the contrast floor"
```

---

### Task 6: Install — hook, Perfil row, manifest, README

**Files:**
- Create: `src/features/pwa/useInstallPrompt.ts`
- Create: `src/features/pwa/useInstallPrompt.test.ts`
- Modify: `src/screens/perfil/Perfil.tsx:115-117`
- Modify: `src/lib/strings.ts` (group `perfil`)
- Modify: `public/manifest.webmanifest`
- Modify: `README.md` (new section after "O que é")
- Test: `src/screens/perfil/Perfil.test.tsx`

**Interfaces:**
- Produces: `useInstallPrompt(): { install: (() => Promise<void>) | null; iphone: boolean }`. `install` is non-null only after a `beforeinstallprompt` event was captured and while not standalone; calling it clears the stored event first, then calls `event.prompt()`. `iphone` is true when not standalone and the user agent matches `/iP(hone|ad|od)/`. Standalone = `matchMedia('(display-mode: standalone)').matches` (guarded when `matchMedia` is missing) or `navigator.standalone === true`. `appinstalled` clears the event. No `preventDefault()` on the event.
- Strings: `STRINGS.perfil.instalar = 'Instalar o app'`, `STRINGS.perfil.instalarDica = 'No iPhone: Compartilhar → Adicionar à Tela de Início'`.

- [ ] **Step 1: Write the failing hook tests** (`renderHook` from RTL; stub `navigator.userAgent` with `vi.spyOn(navigator, 'userAgent', 'get')`; stub `window.matchMedia` per test with `vi.stubGlobal` and restore)

```ts
it('offers install only after the browser event, once per event', async () => {
  const { result } = renderHook(() => useInstallPrompt())
  expect(result.current.install).toBeNull()
  const prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
  act(() => { window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt })) })
  expect(result.current.install).not.toBeNull()
  await act(() => result.current.install!())
  expect(prompt).toHaveBeenCalledTimes(1)
  expect(result.current.install).toBeNull()
})
it('appinstalled withdraws the offer', () => { … dispatch beforeinstallprompt, then appinstalled; install is null })
it('standalone ignores the event and never hints', () => { matchMedia → { matches: true }; iPhone UA; dispatch; install null, iphone false })
it('an iPhone browser gets the hint', () => { iPhone UA, not standalone → iphone true })
it('works where matchMedia does not exist', () => { vi.stubGlobal('matchMedia', undefined); renderHook does not throw; iphone false for a desktop UA })
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/pwa/useInstallPrompt.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useInstallPrompt`** in `src/features/pwa/useInstallPrompt.ts` (≈35 lines): `useState<InstallEvent | null>`, one `useEffect` registering/removing the two listeners, the `standalone()` and `isIphone()` helpers above. Type `InstallEvent = Event & { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> }`.

- [ ] **Step 4: Run hook tests**

Run: `npx vitest run src/features/pwa/useInstallPrompt.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing Perfil tests** (mock `@/features/pwa/useInstallPrompt` like the file mocks its other hooks)

```tsx
it('offers Instalar o app only when the browser can install', async () => {
  installMock.mockReturnValue({ install: null, iphone: false })
  renderPerfil(); expect(screen.queryByRole('button', { name: 'Instalar o app' })).toBeNull()
  const install = vi.fn().mockResolvedValue(undefined)
  installMock.mockReturnValue({ install, iphone: false })
  renderPerfil(); await userEvent.click(screen.getByRole('button', { name: 'Instalar o app' }))
  expect(install).toHaveBeenCalledTimes(1)
})
it('shows the iPhone hint instead on an iPhone browser', () => {
  installMock.mockReturnValue({ install: null, iphone: true })
  renderPerfil(); expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument()
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/screens/perfil/Perfil.test.tsx`
Expected: FAIL.

- [ ] **Step 7: Implement Perfil, strings, manifest, README**

- `Perfil.tsx`: `const { install, iphone } = useInstallPrompt()`; after `<GroupCard …/>` and before the Sair `Button`: `{install ? <Button variant="ghost" className="mt-4" onClick={() => void install()}>{STRINGS.perfil.instalar}</Button> : null}` and `{iphone ? <p className="mt-4 text-center text-[11px] text-ink-2">{STRINGS.perfil.instalarDica}</p> : null}`. If `Perfil.tsx` passes ~200 lines, move the two lines into a tiny `InstallRow` component in `src/features/pwa/InstallRow.tsx`.
- `strings.ts` group `perfil`: the two strings above.
- `public/manifest.webmanifest`: add `"id": "/"`, `"lang": "pt-BR"`, `"description": "Competição de beber água entre duas pessoas."`.
- `README.md`: after "## 💧 O que é", a section `## 📲 Como instalar no celular` with three bullets in plain pt-BR: iPhone (Safari: Compartilhar → Adicionar à Tela de Início), Android (Chrome: menu ⋮ → Instalar app, ou o botão "Instalar o app" no Perfil), computador (ícone de instalar na barra de endereço do Chrome/Edge).

- [ ] **Step 8: Run the suite and typecheck**

Run: `npm run typecheck && npm run test:run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/pwa src/screens/perfil src/lib/strings.ts public/manifest.webmanifest README.md
git commit -m "feat(pwa): Instalar o app in Perfil when the browser offers it, iPhone hint otherwise; manifest id, lang, description; README install section"
```

---

### Task 7: Shell and small fixes — tabs open at the top, swatch pressed state, bottle save label

**Files:**
- Modify: `src/app/AppShell.tsx:37-38`
- Modify: `src/screens/perfil/Perfil.tsx:96-106`
- Modify: `src/lib/strings.ts` (`garrafas.salvar`)
- Test: `src/screens/perfil/Perfil.test.tsx`, `src/screens/perfil/BottleManager.test.tsx:48,57,87`, `src/screens/registrar/RegisterSheet.test.tsx:228`, `src/app/AppShell.test.tsx`

- [ ] **Step 1: Update and write tests**

- `BottleManager.test.tsx` and `RegisterSheet.test.tsx:228`: the save button is `{ name: 'Salvar garrafa' }`.
- `Perfil.test.tsx`: after the accent test at `:74`, assert the chosen swatch has `aria-pressed="true"` and another has `"false"` (names from `STRINGS.perfil.cores`).
- `AppShell.test.tsx`: add a test that the `<main>` element is replaced when the route changes (render at `/hoje`, keep a reference to `document.querySelector('main')`, navigate to `/ranking` the way `:32` does, expect `document.querySelector('main')` not to be the same node).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/screens/perfil src/app/AppShell.test.tsx src/screens/registrar/RegisterSheet.test.tsx`
Expected: FAIL on the three new assertions and the renamed button.

- [ ] **Step 3: Implement**

- `AppShell.tsx`: `<main key={location.pathname} className="scroll-region pb-6">` and drop the `key` from the inner `ErrorBoundary` (the remount covers it; keep the comment explaining why the key is on `main`: tabs open at the top, M9).
- `Perfil.tsx` swatches: `aria-pressed={accentOf(profile.accent) === accent}`.
- `strings.ts`: `garrafas.salvar: 'Salvar garrafa'`.

- [ ] **Step 4: Run the suite and typecheck**

Run: `npm run typecheck && npm run test:run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/AppShell.tsx src/app/AppShell.test.tsx src/screens/perfil src/screens/registrar/RegisterSheet.test.tsx src/lib/strings.ts
git commit -m "fix(shell,perfil): tabs open at the top; swatches expose pressed; Salvar garrafa"
```

---

### Task 7b: App icon and favicon from the owner's illustration

**Files:**
- Source (already in the tree, untracked until Task 0's commit or this one): `docs/img/icone-origem.jpg` — a 422×434 JPEG of a fish in bed dreaming of a glass of water, background `#2B3D4B`.
- Create: `public/icon-512.png`, `public/icon-192.png`, `public/apple-touch-icon.png` (180×180), `public/icon-maskable-512.png`
- Delete: `public/icon.svg` (the drop; nothing references it after this task)
- Modify: `index.html:5,19`, `public/manifest.webmanifest` (icons array)

**Interfaces:**
- Produces: the four PNGs above. `index.html` links `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. The manifest lists `icon-192.png` (192, any), `icon-512.png` (512, any), `icon-maskable-512.png` (512, maskable).

- [ ] **Step 1: Generate the icons** (Pillow is installed for the user's Python; run plain `python`, not `python -I`)

```bash
python - <<'EOF'
from PIL import Image
src = Image.open('docs/img/icone-origem.jpg').convert('RGB')
w, h = src.size; s = min(w, h)
sq = src.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
for size, name in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')):
    sq.resize((size, size), Image.LANCZOS).save(f'public/{name}', optimize=True)
canvas = Image.new('RGB', (512, 512), (43, 61, 75))
inner = sq.resize((410, 410), Image.LANCZOS)
canvas.paste(inner, (51, 51))
canvas.save('public/icon-maskable-512.png', optimize=True)
EOF
```

- [ ] **Step 2: Look at the four PNGs** with the Read tool. Expected: the full scene on the three `any` icons; on the maskable one the scene at 80% centred on the slate background, so a circular mask only trims background and the outer edge of the glass and the fish's tail.

- [ ] **Step 3: Wire them**

`index.html`: replace the SVG `rel="icon"` line with the PNG link above; `apple-touch-icon` → `/apple-touch-icon.png`. `manifest.webmanifest`: the three-entry icons array above. Delete `public/icon.svg`. `git grep -n "icon.svg"` must return nothing in tracked files.

- [ ] **Step 4: Verify the build precaches them**

Run: `npm run typecheck && npm run test:run && npm run build`
Expected: green; the PWA summary lists `icon-maskable-512.png` and `apple-touch-icon.png` among the precache entries, and `icon.svg` is gone.

- [ ] **Step 5: Commit**

```bash
git add docs/img/icone-origem.jpg public index.html
git commit -m "feat(pwa): app icon and favicon from the owner's dreaming-fish illustration"
```

---

### Task 8: Docs, version 1.3.0, verification, cleanup

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (§5.1, §5.2, §5.3, §5.4, §5.5, §7, §8 Tokens/Rules, §9 PWA specifics)
- Modify: `docs/superpowers/specs/2026-09-24-m7-redesign-design.md` (§7.2 token tables, §7.4 picker)
- Modify: `docs/superpowers/plans/ROADMAP.md` (table row + "## M9 — Fechamento" section)
- Modify: `docs/HANDOFF.md` (Current state, Next work)
- Modify: `package.json`, `package-lock.json` (version 1.3.0)

- [ ] **Step 1: Fold the decisions into the parent spec**, one or two sentences each, in the section's own voice: §5.1 fish drawn only once the water covers it (35px / 480 ml at 3 L), loose-only rows without subtitle or chips; §5.2 sticky confirm, Escape/focus, no loose line, 48px keys / 20px digits, 2px selected tile, unit case kept; §5.3 comparison card only for week/month/all with data; §5.4 today ring in `--ink`; §5.5 install row and iPhone hint, five themes; §7 nothing under a full screen, trophy on unlock when lead, no ring; §8 Rules: segmented 15px, keypad 20/800 on 48px, "no pulse" under "Flat only", the toast width; §8 Tokens: five themes, Breu surface; §9 PWA specifics: the install affordance, the manifest fields, and the icon set (the owner's dreaming-fish illustration at 512/192/180 plus a maskable 512 padded on `#2B3D4B`, source in `docs/img/icone-origem.jpg`). Mark each with "(M9)". In the M7 spec: remove the Tinta column/row from §7.2, set Breu surface `#1B1E24`, and say the picker shows five tiles (§7.4).

- [ ] **Step 2: ROADMAP** — add the row `| M9 | Fechamento | [2026-10-20-m9-fechamento.md] | **code-complete** — pending owner verification: rerun npm run e2e after the Supabase reset; on both phones open the sheet with the note open and see the confirm button stay; register the first 250 ml of a day and see the tube without a fish, then 500 ml with it |` and a "## M9 — Fechamento" section listing the changes and a "Calls made here" paragraph (the rejected items from the M9 spec §3, the version bump as persister buster, the trophy only on unlock).

- [ ] **Step 3: HANDOFF** — Current state: nine milestones, version 1.3.0, test count from the final run; Next work: "none planned; e2e rerun after the Supabase reset".

- [ ] **Step 4: Version** — `package.json` `"version": "1.3.0"`; run `npm install` so `package-lock.json` follows (confirm the lockfile diff is only the version).

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run test:run && npm run build`
Expected: typecheck silent; all tests pass (count ≥ 474 + the new ones); build OK; `dist/sw.js` precache lists the four icon PNGs and no `icon.svg`.

- [ ] **Step 6: Screenshot check** (no cloud): start `npx vite --port 4175`, run `node .tmp/review-final/pairs/capture.mjs P03 P04 P07 P10 P11 P14` after pointing its "after" server at 4175 as well (or just read the "antes" side it produces against the new code), and look at the PNGs: the sheet's confirm pinned with the safe-area padding below it, no fish at 250 ml, no stats card on Hoje, the install row absent in a non-installing browser (the hook offers nothing in Chromium headless), five theme tiles, the trophy on the unlock screen. Stop the server.

- [ ] **Step 7: Remove the spike worktree**

Run: `git worktree remove --force .tmp/wt-design && git worktree prune`
Expected: `git worktree list` shows only the main tree.

- [ ] **Step 8: Commit**

```bash
git add docs package.json package-lock.json
git commit -m "docs: M9 — spec, roadmap, handoff; version 1.3.0"
```

- [ ] **Step 9: Finish the branch** with superpowers:finishing-a-development-branch (merge `m9-fechamento` into `development` or open the PR, as the owner prefers; do not push without asking).
