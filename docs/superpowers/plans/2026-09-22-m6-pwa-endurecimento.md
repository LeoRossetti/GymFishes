# M6 — PWA e endurecimento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the installed app offline-capable and self-updating, prove the core flow with one Playwright smoke run, re-verify RLS against the live project now that real entries and photos exist, and measure cold start against spec §1 — without adding a screen, an option or a setting.

**Architecture:** `vite-plugin-pwa` precaches the app shell only (no runtime caching, so Supabase is never touched by the worker); a tiny `features/pwa` module wraps the plugin's React hook and renders one flat update bar. The app version comes from `package.json`, is injected by Vite `define`, shows in Perfil › Sobre and doubles as the TanStack persister `buster`. The first-ever read sync becomes paged. Playwright drives the production build against the cloud project with a throwaway account. Everything else is verification and docs.

**Tech Stack:** React 19, TypeScript strict, Vite 8 (rolldown), Tailwind v4 tokens, `motion` 13, Vitest + RTL. New dev dependencies: `vite-plugin-pwa` 1.3 (Workbox 7) and `@playwright/test` 1.63. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-08-11-gymfishes-design.md` — binding. §1 success criteria, §5.5 Perfil › Sobre, §8 design system, §9 architecture and "PWA specifics", §11 RLS checklist, §12 reads, §14 error handling, §15 testing strategy. **Roadmap:** `docs/superpowers/plans/ROADMAP.md` § M6.

**Design skills for implementers** (Tasks 1 and 3 touch UI — read before editing, in this order):
- Intent (reasoning behind the two surfaces): `C:\Users\leofr\.claude\skills\intent\SKILL.md` — the principles used here are *user autonomy* (nothing reloads by itself), *make intent visible* (the button says exactly what the tap does; the version line answers "which build am I on") and *feedback loops* (busy state while the update applies).
- Frontend design: invoke the `frontend-design:frontend-design` skill. The brief pins palette, type and flat rules (spec §8); the only free axes are the shape of the update bar and the Sobre line, and both are decided below. Refinement, not redesign.
- Impeccable floor: `C:\Users\leofr\.claude\skills\impeccable\reference\craft-floor.md` immediately before the edit, then `C:\Users\leofr\.claude\skills\impeccable\reference\polish.md`. After both UI tasks are done, run the mechanical detector once: `sh C:/Users/leofr/.claude/skills/impeccable/scripts/impeccable detect --json src/features/pwa/UpdatePrompt.tsx src/screens/perfil/Perfil.tsx` and fix what it flags.

## Global Constraints

- UI is pt-BR only; every user-visible string lives in `src/lib/strings.ts`. Numbers via `formatVolume`.
- Colours only via tokens in `src/styles/tokens.css`; dark only; flat (no gradients, glow, shadows). Beyond blue: green (confirm), yellow (streak/first), red (delete).
- Touch targets ≥ 44px. Type scale 38/24/20/17/15/13/11/9. `--ink-3` carries labels and disabled states, never content text.
- Date math only in `src/lib/dates.ts` / `src/lib/periods.ts`; `America/Sao_Paulo` fixed.
- TypeScript `strict` + `noUncheckedIndexedAccess`; no `any`. Components never import `supabase`.
- Behaviour changes are test-first; tests go through roles and pt-BR text. `npm run test:run && npm run typecheck` green before every commit.
- Service worker never caches Supabase (spec §9): precache only, no `runtimeCaching`.
- No new screens, options, settings or runtime dependencies. Simplicity is a feature.
- Commands run in Git Bash from the repo root. `.env.local` holds live credentials: never print it, never commit it, never overwrite it.
- The cloud Supabase project is the only database. Verification tasks create throwaway accounts and rows in a throwaway group, exactly as the 2026-09-01 RLS run did, and never write under the real group.

---

### Task 1: Version, build date, persister buster and Perfil › Sobre

**Files:**
- Modify: `package.json` (version), `vite.config.ts` (define), `tsconfig.app.json` (no change yet), `src/main.tsx` (buster)
- Create: `src/globals.d.ts`, `src/lib/version.ts`
- Modify: `src/lib/format.ts` (+ `src/lib/format.test.ts`), `src/lib/strings.ts`, `src/screens/perfil/Perfil.tsx` (+ `Perfil.test.tsx`)

**Interfaces:**
- Produces: `APP_VERSION: string`, `BUILD_DATE: string` (ISO) from `@/lib/version`; `formatBuildDate(iso: string): string` from `@/lib/format`; `STRINGS.perfil.sobre(versao: string, data: string): string`.

**Design ruling (Sobre):** a single quiet line under "Sair", centred, 11px, `text-ink-2` (it is content the user reads when debugging, so not `--ink-3`), no section label (a 9px "SOBRE" over one line would be a label without a job — the line explains itself). Copy `Versão 1.0.0 · 22/09/2026` uses the app's existing ` · ` joiner (entry rows, Histórico footer). It is the only place the app shows a year, on purpose: the question it answers is "is this phone on the build I just deployed?".

- [ ] **Step 1: Bump the version.** In `package.json` change `"version": "0.0.0"` to `"version": "1.0.0"` — M6 completes the v1 spec.

- [ ] **Step 2: Inject version and build date.** Replace `vite.config.ts` with:

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Declare the globals and the module.** Create `src/globals.d.ts`:

```ts
// Injected by Vite `define` (vite.config.ts) at build time.
declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string
```

Create `src/lib/version.ts`:

```ts
/** Build identity (spec §5.5 "Sobre", §9): shown in Perfil and used as the persister buster. */
export const APP_VERSION: string = __APP_VERSION__
export const BUILD_DATE: string = __BUILD_DATE__
```

- [ ] **Step 4: Failing test for the date formatter.** Append to `src/lib/format.test.ts`:

```ts
describe('formatBuildDate', () => {
  it('formats the build stamp as dd/mm/yyyy in São Paulo time', () => {
    // 02:30 UTC on the 22nd is still the 21st in America/Sao_Paulo (UTC-3)
    expect(formatBuildDate('2026-09-22T02:30:00.000Z')).toBe('21/09/2026')
  })
})
```

Add `formatBuildDate` to the existing import from `./format`.

- [ ] **Step 5: Run it to see it fail.** `npx vitest run src/lib/format.test.ts` — expected: FAIL, `formatBuildDate` is not exported.

- [ ] **Step 6: Implement.** In `src/lib/format.ts`, next to the other `Intl.DateTimeFormat` instances:

```ts
const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: APP_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Build stamp for Perfil › Sobre — the one place the app shows a year. */
export function formatBuildDate(iso: string): string {
  return SHORT_DATE.format(new Date(iso))
}
```

- [ ] **Step 7: Run it to see it pass.** `npx vitest run src/lib/format.test.ts` — expected: PASS.

- [ ] **Step 8: String.** In `src/lib/strings.ts`, inside `perfil`, after `sairMesmo`:

```ts
    sobre: (versao: string, data: string) => `Versão ${versao} · ${data}`,
```

- [ ] **Step 9: Failing test for the Sobre line.** In `src/screens/perfil/Perfil.test.tsx` add a test (the existing mocks already render Perfil):

```ts
  it('shows the app version and build date under Sair', () => {
    renderWithProviders(<Perfil />)
    expect(screen.getByText(/^Versão \d+\.\d+\.\d+ · \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument()
  })
```

Run `npx vitest run src/screens/perfil/Perfil.test.tsx` — expected: FAIL, no such text.

- [ ] **Step 10: Render it.** In `src/screens/perfil/Perfil.tsx` import `formatBuildDate` from `@/lib/format` and `APP_VERSION, BUILD_DATE` from `@/lib/version`; after the Sair `<Button>` add:

```tsx
      <p className="mt-6 pb-2 text-center text-[11px] text-ink-2">
        {STRINGS.perfil.sobre(APP_VERSION, formatBuildDate(BUILD_DATE))}
      </p>
```

Run the Perfil test — expected: PASS.

- [ ] **Step 11: Persister buster.** In `src/main.tsx` import `APP_VERSION` from `@/lib/version` and change the provider props to:

```tsx
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: APP_VERSION }}
```

Add a comment above it: `// A version bump discards the persisted mirror, so a changed Entry shape can never rehydrate old rows (roadmap M6). The outbox and seen_unlocks live elsewhere and survive.`

- [ ] **Step 12: Verify and commit.** `npm run test:run && npm run typecheck && npm run build`. Commit:

```bash
git add package.json vite.config.ts src/globals.d.ts src/lib/version.ts src/lib/format.ts src/lib/format.test.ts src/lib/strings.ts src/screens/perfil/Perfil.tsx src/screens/perfil/Perfil.test.tsx src/main.tsx
git commit -m "feat(perfil): version and build date in Sobre; persister buster tied to the app version"
```

---

### Task 2: Service worker — precached shell, latin-only fonts, update hook

**Files:**
- Modify: `package.json` (dev dependency), `vite.config.ts`, `tsconfig.app.json`, `src/main.tsx` (font imports)
- Create: `src/features/pwa/registerSW.ts`

**Interfaces:**
- Produces: `useAppUpdate(): { ready: boolean; apply: () => Promise<void> }` from `@/features/pwa/registerSW`. `ready` turns true when a new build is waiting; `apply` tells the waiting worker to take over and reloads the page once it controls it.

- [ ] **Step 1: Install.** `npm i -D vite-plugin-pwa` (npm installs the `workbox-build` / `workbox-window` peers automatically; the assets generator peer is optional and not needed).

- [ ] **Step 2: Latin-only fonts.** In `src/main.tsx` replace the three font imports with:

```ts
import '@fontsource/nunito/latin-500.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
```

pt-BR's accented letters live in the latin subset; the cyrillic, vietnamese and latin-ext files (18 of the 24 the build shipped) were never rendered and would have been precached for nothing.

- [ ] **Step 3: Plugin config.** In `vite.config.ts` add `import { VitePWA } from 'vite-plugin-pwa'` and change `plugins` to:

```ts
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The new worker waits for the user's tap (spec §9) — nothing reloads by itself.
      registerType: 'prompt',
      // Registration happens through the React hook in src/features/pwa/registerSW.ts.
      injectRegister: false,
      // public/manifest.webmanifest is hand-written and already linked from index.html.
      manifest: false,
      workbox: {
        // App shell only. No runtimeCaching: Supabase is never cached by the worker (spec §9).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
```

- [ ] **Step 4: Types.** In `tsconfig.app.json` change `"types": ["vite/client"]` to `"types": ["vite/client", "vite-plugin-pwa/react"]`.

- [ ] **Step 5: The hook.** Create `src/features/pwa/registerSW.ts`:

```ts
import { useRegisterSW } from 'virtual:pwa-register/react'

export type AppUpdate = { ready: boolean; apply: () => Promise<void> }

/**
 * Update plumbing (spec §9). The waiting worker never takes over on its own — a reload
 * mid-register would drop the draft — so `ready` only surfaces the fact and `apply`
 * acts on the user's tap. New builds are looked for when the app comes back to the
 * foreground, the same trigger family as the outbox flush.
 */
export function useAppUpdate(): AppUpdate {
  const {
    needRefresh: [ready],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })
  return { ready, apply: () => updateServiceWorker(true) }
}
```

- [ ] **Step 6: Build and inspect.** `npm run build`, then `ls dist` and `grep -o 'nunito[^"]*woff2' dist/sw.js | sort -u`. Expected: `dist/sw.js` and `dist/workbox-*.js` exist, `dist/manifest.webmanifest` is byte-identical to `public/manifest.webmanifest` (`diff public/manifest.webmanifest dist/manifest.webmanifest` prints nothing), the precache lists exactly three Nunito woff2 files (latin 500/700/800) and no `.woff`.

- [ ] **Step 7: Tests still green.** `npm run test:run && npm run typecheck` — the virtual module is only imported by `registerSW.ts`, which no test imports yet.

- [ ] **Step 8: Commit.**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.app.json src/main.tsx src/features/pwa/registerSW.ts
git commit -m "feat(pwa): precached app shell with vite-plugin-pwa, prompt-mode update hook, latin-only Nunito"
```

---

### Task 3: The update bar

**Files:**
- Create: `src/features/pwa/UpdatePrompt.tsx`, `src/features/pwa/UpdatePrompt.test.tsx`
- Modify: `src/lib/strings.ts`, `src/main.tsx`

**Interfaces:**
- Consumes: `useAppUpdate()` from Task 2.
- Produces: `<UpdatePrompt />`, mounted once at the root.

**Design ruling:** Operate mode — the user is mid-task; the bar informs and offers, it never interrupts. One flat card-shaped bar floating above the tab bar at the Toast's height (`bottom-28`): `--surface-2` fill, 1px `--line` border, `rounded-control`. Left: "Nova versão disponível", 13px bold `--ink`. Right: the primary `Button` reading "Atualizar" — the only saturated element on the bar, so the action is read before the message. It enters with a 12px rise over 200 ms (`useReducedMotion` → 120 ms fade, no offset), the same vocabulary as the register sheet. No icon, no close button: it lives for the session only (a full close applies the update on the next open anyway), and a dismissed prompt would leave the phone on a stale build with nothing to say so. `role="status"` so VoiceOver announces the message; the button carries `aria-busy` while the worker swaps. Mounted at the root so the login screen gets it too. If a Toast fires while the bar is up, the Toast covers it for four seconds — accepted, no stacking logic.

- [ ] **Step 1: Strings.** In `src/lib/strings.ts` add a top-level group after `sync`:

```ts
  atualizacao: {
    disponivel: 'Nova versão disponível',
    atualizar: 'Atualizar',
    atualizando: 'Atualizando…',
  },
```

- [ ] **Step 2: Failing test.** Create `src/features/pwa/UpdatePrompt.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdatePrompt } from './UpdatePrompt'

const update = vi.hoisted(() => ({ ready: false, apply: vi.fn(() => Promise.resolve()) }))
vi.mock('@/features/pwa/registerSW', () => ({
  useAppUpdate: () => ({ ready: update.ready, apply: update.apply }),
}))

describe('UpdatePrompt', () => {
  it('renders nothing while the build is current', () => {
    update.ready = false
    render(<UpdatePrompt />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('announces the new build and applies it on tap', async () => {
    update.ready = true
    render(<UpdatePrompt />)
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível')
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(update.apply).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Atualizando…' })).toHaveAttribute('aria-busy', 'true')
  })
})
```

Run `npx vitest run src/features/pwa/UpdatePrompt.test.tsx` — expected: FAIL, module not found.

- [ ] **Step 3: Component.** Read the craft-floor reference, then create `src/features/pwa/UpdatePrompt.tsx`:

```tsx
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useAppUpdate } from '@/features/pwa/registerSW'
import { STRINGS } from '@/lib/strings'
import { Button } from '@/ui/Button'

/** "Nova versão disponível — atualizar" (spec §9). Informs and offers; never reloads on its own. */
export function UpdatePrompt() {
  const { ready, apply } = useAppUpdate()
  const reduced = useReducedMotion()
  const [busy, setBusy] = useState(false)
  if (!ready) return null
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.2 }}
      className="fixed inset-x-3 bottom-28 z-40 mx-auto flex max-w-[406px] items-center gap-3
                 rounded-control border border-line bg-surface-2 p-2 pl-4"
    >
      <p className="min-w-0 flex-1 text-[13px] font-bold text-ink">{STRINGS.atualizacao.disponivel}</p>
      <div className="w-[128px] shrink-0">
        <Button
          disabled={busy}
          aria-busy={busy || undefined}
          onClick={() => {
            setBusy(true)
            void apply()
          }}
        >
          {busy ? STRINGS.atualizacao.atualizando : STRINGS.atualizacao.atualizar}
        </Button>
      </div>
    </motion.div>
  )
}
```

The `Button` primitive is `w-full`; the fixed-width wrapper sizes it without fighting its classes.

- [ ] **Step 4: Run the test to see it pass.** `npx vitest run src/features/pwa/UpdatePrompt.test.tsx` — expected: PASS.

- [ ] **Step 5: Mount at the root.** In `src/main.tsx` import `UpdatePrompt` from `@/features/pwa/UpdatePrompt` and render it as a sibling after `</BrowserRouter>`, still inside `PersistQueryClientProvider`:

```tsx
      </BrowserRouter>
      <UpdatePrompt />
    </PersistQueryClientProvider>
```

- [ ] **Step 6: See it in a browser.** `npm run build && npm run preview`, open `http://localhost:4173/entrar` in a phone-width window, install the worker (first load), then change any string, rebuild while the preview is running, and switch tabs away and back: the bar should rise above the login form; tapping "Atualizar" reloads onto the new build. If the preview does not pick up the rebuilt `dist`, stop and restart it. Take one screenshot for the report.

- [ ] **Step 7: Detector and polish.** Run `sh C:/Users/leofr/.claude/skills/impeccable/scripts/impeccable detect --json src/features/pwa/UpdatePrompt.tsx src/screens/perfil/Perfil.tsx`; fix real findings (ignore any that would require leaving the token palette or the flat rules).

- [ ] **Step 8: Verify and commit.** `npm run test:run && npm run typecheck`.

```bash
git add src/lib/strings.ts src/features/pwa/UpdatePrompt.tsx src/features/pwa/UpdatePrompt.test.tsx src/main.tsx
git commit -m "feat(pwa): update bar — Nova versão disponível, Atualizar"
```

---

### Task 4: Paged read sync; first sync skips soft-deleted rows

**Files:**
- Modify: `src/features/entries/sync.ts` (+ `sync.test.ts`), `src/features/entries/api.ts`

**Interfaces:**
- Produces: `fetchAllPages<T>(fetchPage: (from: number, to: number) => Promise<T[]>, pageSize?: number): Promise<T[]>` and `SYNC_PAGE = 1000` from `./sync`. `fetchEntriesSince` keeps its signature.

Why: PostgREST caps a response at 1000 rows and says nothing. Two people at eight registers a day cross that in about two months, so a new device's first sync would show a truncated mirror until several refetches caught up. The paging loop is pure and tested; the query stays where it was.

- [ ] **Step 1: Failing tests.** Append to `src/features/entries/sync.test.ts` (add `fetchAllPages` to the import from `./sync`):

```ts
describe('fetchAllPages', () => {
  it('keeps asking until a page comes back short', async () => {
    const calls: Array<[number, number]> = []
    const rows = await fetchAllPages(async (from, to) => {
      calls.push([from, to])
      return from === 0 ? [0, 1, 2] : [3]
    }, 3)
    expect(rows).toEqual([0, 1, 2, 3])
    expect(calls).toEqual([
      [0, 2],
      [3, 5],
    ])
  })

  it('stops after a single short page', async () => {
    const calls: Array<[number, number]> = []
    const rows = await fetchAllPages(async (from, to) => {
      calls.push([from, to])
      return ['a', 'b']
    }, 3)
    expect(rows).toEqual(['a', 'b'])
    expect(calls).toEqual([[0, 2]])
  })

  it('returns an empty list for an empty first page', async () => {
    expect(await fetchAllPages(async () => [], 3)).toEqual([])
  })
})
```

Run `npx vitest run src/features/entries/sync.test.ts` — expected: FAIL, `fetchAllPages` not exported.

- [ ] **Step 2: Implement.** Append to `src/features/entries/sync.ts`:

```ts
/** PostgREST silently caps a response at 1000 rows. */
export const SYNC_PAGE = 1000

/** Fetch `[from, to]` windows until a page comes back short of `pageSize`. */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = SYNC_PAGE,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1)
    all.push(...page)
    if (page.length < pageSize) return all
  }
}
```

Run the test — expected: PASS.

- [ ] **Step 3: Use it.** In `src/features/entries/api.ts` import `fetchAllPages` from `./sync` and replace `fetchEntriesSince`:

```ts
/**
 * Watermark read (spec §12): everything that changed since `since`, INCLUDING soft-deleted
 * rows — that is what makes deletions sync. On the first-ever sync there is nothing to
 * un-delete, so deleted rows are skipped; any newer than the resulting watermark are
 * fetched (and dropped) on the next incremental pass. Paged, because PostgREST caps at 1000.
 */
export function fetchEntriesSince(groupId: string, since: string | undefined): Promise<Entry[]> {
  return fetchAllPages(async (from, to) => {
    let query = supabase.from('entries').select('*').eq('group_id', groupId)
    query = since === undefined ? query.is('deleted_at', null) : query.gt('updated_at', since)
    const { data, error } = await query
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)
    if (error) throw error
    return data
  })
}
```

The second `order` makes the window stable when two rows share an `updated_at`.

- [ ] **Step 4: Verify and commit.** `npm run test:run && npm run typecheck`.

```bash
git add src/features/entries/sync.ts src/features/entries/sync.test.ts src/features/entries/api.ts
git commit -m "fix(sync): page the read sync in 1000-row windows; first sync skips soft-deleted rows"
```

---

### Task 5: Playwright smoke — login → 500 ml → Hoje → Ranking → reload → clean up

**Files:**
- Modify: `package.json` (dev dependency, `e2e` script), `vite.config.ts` (exclude `e2e/**` from Vitest), `tsconfig.node.json` (include), `.gitignore`, `.env.example`
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: pt-BR roles and names already in the app: labels "E-mail"/"Senha", button "Entrar", h1 "Hoje"/"Ranking", button "Registrar água" (the tab-bar "+"), pill "+500", CTA "Registrar 500 ml", tab links "Hoje"/"Ranking", entry rows are `<li>` whose toggle `<button>` has `aria-expanded`, "Excluir" then "Excluir mesmo?", celebration `role="dialog"` closed by a tap (or "Depois" for a fish unlock).

- [ ] **Step 1: Install.** `npm i -D @playwright/test` then `npx playwright install webkit` (the iPhone 14 preset runs WebKit). If WebKit fails to launch on this Windows machine, run `npx playwright install chromium` and add `defaultBrowserType: 'chromium'` to the `use` block below — the preset's viewport, scale and user agent stay.

- [ ] **Step 2: Config.** Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

// Node 24 reads .env.local natively. E2E_EMAIL / E2E_PASSWORD carry no VITE_ prefix,
// so Vite never bundles them.
try {
  process.loadEnvFile('.env.local')
} catch {
  // no .env.local (CI): the spec skips itself
}

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { ...devices['iPhone 14'], baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
})
```

- [ ] **Step 3: Scripts and housekeeping.** In `package.json` scripts add `"e2e": "npm run build && playwright test"`. In `vite.config.ts` import `configDefaults` from `'vitest/config'` and add `exclude: [...configDefaults.exclude, 'e2e/**']` inside `test` (otherwise Vitest picks up the spec). In `tsconfig.node.json` change `"include": ["vite.config.ts"]` to `"include": ["vite.config.ts", "playwright.config.ts", "e2e"]`. Append to `.gitignore`:

```
# Playwright
test-results/
playwright-report/
```

Append to `.env.example`:

```
# Conta descartável usada pelo teste ponta a ponta (npm run e2e). Sem prefixo VITE_: nunca entra no app.
E2E_EMAIL=
E2E_PASSWORD=
```

- [ ] **Step 4: The throwaway account (once).** With `npm run dev` running, open the app in a browser, tap "Ainda não tenho conta" and create `gymfishes-e2e@example.com` with a fresh random password, then complete onboarding: name `E2E`, keep the guppy, "Criar grupo" named `E2E`. Append `E2E_EMAIL=` and `E2E_PASSWORD=` lines with those values to `.env.local` (append only — never rewrite the file). This account is alone in its own group, so nothing it does can touch the real group; Task 7 reuses it.

- [ ] **Step 5: The spec.** Create `e2e/smoke.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

/** A celebration may cover the screen after a register (spec §7); a tap closes it. */
async function dismissCelebration(page: Page) {
  const dialog = page.getByRole('dialog')
  const shown = await dialog.isVisible({ timeout: 1500 }).catch(() => false)
  if (!shown) return
  const depois = dialog.getByRole('button', { name: 'Depois' })
  if (await depois.isVisible()) await depois.click()
  else await dialog.click({ position: { x: 10, y: 10 } })
  await expect(dialog).toBeHidden()
}

/** Collapsed entry rows showing 500 ml — tubes and pills have no aria-expanded. */
const rows500 = (page: Page) =>
  page.getByRole('button', { expanded: false }).filter({ hasText: '500 ml' })

test('entrar → registrar 500 ml → Hoje → Ranking → recarregar → limpar', async ({ page }) => {
  test.skip(!email || !password, 'Defina E2E_EMAIL e E2E_PASSWORD em .env.local')

  await page.goto('/entrar')
  await page.getByLabel('E-mail').fill(email!)
  await page.getByLabel('Senha').fill(password!)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  const before = await rows500(page).count()

  await page.getByRole('button', { name: 'Registrar água' }).click()
  await page.getByRole('button', { name: '+500' }).click()
  await page.getByRole('button', { name: 'Registrar 500 ml' }).click()
  await dismissCelebration(page)
  await expect(rows500(page)).toHaveCount(before + 1)

  await page.getByRole('link', { name: 'Ranking' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ranking' })).toBeVisible()
  const minhaLinha = page.getByRole('listitem').filter({ hasText: 'Você' })
  await expect(minhaLinha).toContainText(/\d+ ml|\d+(,\d+)? L/)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Ranking' })).toBeVisible()
  await expect(minhaLinha).toContainText(/\d+ ml|\d+(,\d+)? L/)

  // Leave the account as we found it, so the run is idempotent.
  await page.getByRole('link', { name: 'Hoje' }).click()
  await expect(rows500(page)).toHaveCount(before + 1)
  await rows500(page).first().click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).click()
  await page.getByRole('button', { name: 'Excluir mesmo?' }).click()
  await expect(rows500(page)).toHaveCount(before)
})
```

- [ ] **Step 6: Run it.** `npm run e2e` — expected: 1 passed. If a locator misses, fix the locator against the real markup (the roles and strings above come from the components; do not change the app to fit the test). Run it twice in a row to prove idempotence.

- [ ] **Step 7: Unit tests unaffected.** `npm run test:run && npm run typecheck` (typecheck now covers the config and the spec through `tsconfig.node.json`).

- [ ] **Step 8: Commit.**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.node.json .gitignore .env.example playwright.config.ts e2e/smoke.spec.ts
git commit -m "test(e2e): Playwright smoke on the iPhone 14 preset — login, 500 ml, Hoje, Ranking, reload, clean-up"
```

---

### Task 6: Performance pass against §1 criterion 4

**Files:**
- Modify: `vite.config.ts` (vendor chunks)
- Create: `docs/superpowers/2026-09-22-m6-performance.md`

Criterion: *cold start to interactive on 4G, installed to home screen: < 2 seconds.* Method: Lighthouse mobile (simulated slow 4G) against the production preview, before and after. Lighthouse needs a local Chrome; if it cannot find one, set `CHROME_PATH` to the Chrome executable.

- [ ] **Step 1: Baseline.** `npm run build && npm run preview` in one terminal. In another:

```bash
mkdir -p .superpowers/perf
npx --yes lighthouse http://localhost:4173/entrar --preset=perf --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --chrome-flags="--headless=new" --output=json --output-path=.superpowers/perf/before.json --quiet
node -e "const a=require('./.superpowers/perf/before.json').audits;for(const k of ['first-contentful-paint','largest-contentful-paint','total-blocking-time','speed-index','interactive'])console.log(k,a[k]&&a[k].displayValue)"
```

Note the five values and the JS/CSS sizes printed by `vite build`.

- [ ] **Step 2: Vendor chunks.** The app ships one 690 KB chunk, so every deploy re-downloads everything. Split the libraries that change only when their version changes, so an update precaches only app code. In `vite.config.ts` add:

```ts
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/ },
          ],
        },
      },
    },
  },
```

`npm run build` — expected: four vendor chunks plus a smaller `index-*.js`, no 500 KB warning. If rolldown rejects the option shape, read `node_modules/rolldown/dist/shared/define-config-*.d.mts` for `CodeSplittingGroup` (`name`, `test`) and adjust — do not fall back to `manualChunks`, which is deprecated.

- [ ] **Step 3: Re-measure.** Restart the preview, rerun the Lighthouse command writing to `.superpowers/perf/after.json`, print the same five values.

- [ ] **Step 4: Report.** Create `docs/superpowers/2026-09-22-m6-performance.md` with: the method (command, Lighthouse version from the JSON's `lighthouseVersion`, machine), a table `metric | before | after` for the five metrics, a table of chunk sizes (raw and gzip) before and after from the build output, and a one-paragraph verdict against criterion 4: state plainly whether simulated slow-4G LCP and the interactive audit land under 2 s on the uncached first load, and note that an installed phone serves the shell from the precache, so its cold start is bounded by parse and execute rather than by the network. Do not lazy-load screens or the celebration: nothing in the numbers would justify the extra chunks and the offline seam they add before the worker's first install.

- [ ] **Step 5: Verify and commit.** `npm run test:run && npm run typecheck && npm run e2e`.

```bash
git add vite.config.ts docs/superpowers/2026-09-22-m6-performance.md
git commit -m "perf: vendor chunks for stable precache across deploys; Lighthouse report against spec §1"
```

---

### Task 7: RLS checklist re-run against the live project

**Files:**
- Create: `docs/superpowers/2026-09-22-rls-checklist-evidence.md`

Method: repeat the programmatic procedure of `docs/superpowers/2026-09-01-rls-checklist-evidence.md` (curl against the project's REST, Auth and Storage APIs, tokens redacted in the write-up), now that the real group has entries, bottles and photo objects. Read that document first and follow its request shapes; it also records the real group id used for the negative checks.

- Accounts: **E** is the e2e account from Task 5 (own group, alone). **F** is a fresh throwaway created through the sign-up endpoint; F inserts its own profile row and joins E's group through the `join_group` RPC using the invite code E reads from its own group row.
- Seed: E inserts one bottle and one entry (with a small JPEG uploaded to `photos/<E's group>/<E>/rls.jpg` and its thumb path) — positive controls that F, in the same group, can read the entry and sign the photo.
- Negative checks 1–7 from spec §11, targeted at the real group id and at E's rows: F cannot read the real group's entries; F cannot read E's bottles though they share a group; F cannot update or soft-delete E's entry; F cannot insert an entry with E's `profile_id`; F cannot list or sign objects under the real group's storage prefix, and cannot upload into it; F cannot insert itself into the real group's `group_members`; an invalid invite code raises `invalid_code` and creates nothing.
- Admin cross-checks (`npx supabase db query --linked`, read-only) are welcome where the permission is granted; where it is not, verify the negatives through each account's own reads and say so in the document.
- Clean-up: E removes the test photo objects and soft-deletes its test entry and archives its bottle through the same APIs. Accounts E and F and the throwaway group stay (E is the permanent e2e account). Nothing under the real group is ever written.

- [ ] **Step 1: Prepare F and the seed rows** as above; keep every id you create in a scratch note.
- [ ] **Step 2: Run the seven negative checks and the positive controls**, recording request, HTTP status and body summary for each.
- [ ] **Step 3: Clean up E's test rows and objects.**
- [ ] **Step 4: Write the evidence document** in the same structure as the 2026-09-01 one: setup, results table (`# | check | result | HTTP | notes`), positive controls, ids created, clean-up performed, and what was or was not admin-verified. All tokens redacted.
- [ ] **Step 5: Commit.**

```bash
git add docs/superpowers/2026-09-22-rls-checklist-evidence.md
git commit -m "docs: §11 RLS checklist re-run against the live project with entries and photos present"
```

If any negative check does **not** pass, stop, do not fix the policy inside this task, and report it: a policy change is a new migration and its own review.

---

### Task 8: Docs — spec alignment, roadmap, README

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md`, `docs/superpowers/plans/ROADMAP.md`, `README.md`

- [ ] **§2 Decision log.** Add a row after "Display font": `| App version | \`package.json\` version, injected at build, shown in Perfil › Sobre with the build date, and used as the persister \`buster\` | One number answers "which build is this phone on?" and a bump is what discards an old-shaped mirror |`.
- [ ] **§9 Stack.** Change `| Build | Vite 6 |` to `| Build | Vite 8 (rolldown) |`.
- [ ] **§9 PWA specifics.** Replace the last bullet with: `- A version string and build date are displayed in Perfil › Sobre. The worker is registered in prompt mode: when a new build is waiting, a flat bar above the tab bar reads "Nova versão disponível" with an "Atualizar" button. Nothing reloads on its own — a reload mid-register would drop the draft. New builds are checked for when the app returns to the foreground. The persisted query cache is keyed by the app version, so a version bump discards it; the outbox and seen unlocks are stored separately and survive.` Add a bullet: `- Only the latin Nunito subsets ship; pt-BR needs nothing else, and the precache stays small.`
- [ ] **§12 Reads.** After item 4 add: `5. Reads are paged in 1000-row windows (PostgREST caps a response there). The first-ever sync skips soft-deleted rows — an empty mirror has nothing to un-delete — and any deleted row newer than the resulting watermark is fetched and dropped on the next pass.`
- [ ] **§15 Playwright.** Replace the paragraph with: `**Playwright — one smoke flow**, iPhone 14 preset, against the production build and the cloud project with a throwaway account alone in its own group: login → register 500 ml → appears in Hoje → appears in Ranking → survives reload → the register is deleted so the run is idempotent. \`npm run e2e\`; credentials in \`.env.local\` without the \`VITE_\` prefix.`
- [ ] **§16 Structure.** Under `features/` add `pwa/                  registerSW.ts UpdatePrompt.tsx`; under `lib/` add `version.ts`; at the top level add `e2e/                    smoke.spec.ts (Playwright)` and `playwright.config.ts`.
- [ ] **Roadmap row.** Change the M6 row to: `| M6 | PWA e endurecimento | [\`2026-09-22-m6-pwa-endurecimento.md\`](2026-09-22-m6-pwa-endurecimento.md) | **code-complete** — pending owner verification: deploy, open the installed app on both phones and see the update bar appear after the next deploy; airplane mode → the app opens to yesterday's data; Perfil › Sobre shows the new version |`.
- [ ] **Roadmap section.** Replace the `## M6` bullets with one line per task (eight lines) and this note: `Calls made here: version 1.0.0 doubles as the persister buster; the update bar has no dismiss and never auto-reloads; vendor chunks are split for precache stability, screens are not lazy-loaded; the first sync skips soft-deleted rows and all reads are paged. The e2e account lives in a throwaway group and is also account E of the RLS re-run.`
- [ ] **README.** Under "Como rodar no computador", after the code block, add: `Para rodar o teste ponta a ponta (abre o app num iPhone simulado e registra 500 ml): \`npm run e2e\`, com \`E2E_EMAIL\` e \`E2E_PASSWORD\` preenchidos no \`.env.local\`.`
- [ ] `npm run test:run && npm run typecheck && npm run build`; commit `docs: M6 — spec 2/9/12/15/16 aligned, roadmap row, README e2e line`.

## Owner verifications (manual, after code-complete)

1. Deploy `development` (or merge to `main`) and open the installed app on both phones: Perfil › Sobre reads `Versão 1.0.0 · <date>`.
2. Deploy once more (any commit): background the app, bring it back — the bar "Nova versão disponível" appears above the tab bar; "Atualizar" reloads onto the new build and Sobre shows the new date.
3. Airplane mode, force-quit, reopen: the app opens to yesterday's data with the "Sem conexão" pill; a register made there appears after reconnecting.
4. Skim `docs/superpowers/2026-09-22-rls-checklist-evidence.md` and `docs/superpowers/2026-09-22-m6-performance.md`.
