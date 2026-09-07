# M3 — Offline e Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A register made in airplane mode survives a force-quit and syncs on next open.

**Architecture:** Three pieces, all client-side (no migration in this milestone). **(1) A durable outbox:** every entry write becomes an op in a single IndexedDB-persisted FIFO array (`idb-keyval`, one key, whole-array writes — trivially FIFO, and photo Blobs survive the structured clone). Ops for the same entry merge in place; a flush engine drains the queue head-first, uploading photos before the row write, distinguishing transient errors (offline, expired JWT — wait, don't count) from server rejections (count toward 5 attempts, exponential backoff capped at 60 s, then a manual-retry state). **(2) Incremental reads:** `useEntries`'s queryFn becomes the watermark sync itself — fetch rows with `updated_at` greater than the newest *server* timestamp already in the mirror, merge by id, drop soft-deleted. TanStack Query's mount/focus/reconnect refetching provides the spec's "app start / focus / online" read triggers with zero extra wiring. **(3) A persisted mirror:** the whole query cache goes through `PersistQueryClientProvider` into IndexedDB, so the app renders data and accepts registers with no connectivity at all.

**Tech Stack:** TanStack Query 5 + `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`, `idb-keyval` (new deps), `fake-indexeddb` (new dev dep), React 19, TypeScript strict, Supabase (unchanged schema), Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-08-11-gymfishes-design.md` — the binding spec. Sections used heavily: §5.1 (pending rows), §9 (local-first, PWA flush triggers), §12 (sync, outbox), §13 (photos), §14 (error handling), §15 (testing). Where this plan deviates, Task 6 updates the spec in the same commit.

## Deliberate deviations from the spec (settled here, spec updated in Task 6)

1. **Pending entries stay editable and deletable.** §5.1 says a queued register "is not editable until it syncs", but §12 requires "an update or delete for an entry still queued is merged into the pending op". Both can't hold — if pending rows were locked, the merge logic would be dead code, and a wrong 5 L register made offline would be unfixable for hours. §12 wins: edits merge into the queued op (a `rev` counter guards against merges racing an in-flight send), and idempotent upserts make re-sends safe.
2. **The watermark is derived from the mirror, not stored.** §12 says "read `lastSyncAt` from IndexedDB… store the newest `updated_at` seen". A separately-stored watermark can run *ahead* of the persisted cache (the persister throttles writes; a force-quit between watermark write and cache write silently loses rows forever). Instead the watermark is computed as the max server `updated_at` in the mirror itself — optimistic rows carry `updated_at: ''` so client clocks never pollute it. Crash-safe by construction, and one less thing stored.
3. **A photo attached offline renders as the 💧 tile until it uploads.** The row appears instantly (better than M2, where the entry waited for the upload); rendering the local Blob in the row would need object-URL lifecycle plumbing for a state that normally lasts under a second. Leaner to skip.
4. **Network errors while "online" retry every 30 s without counting attempts.** The 5-attempt/60 s backoff (spec §12) applies to real server responses. Airplane mode must never end in "Falha ao enviar" — offline is a wait, not a failure (§14).

## Global Constraints

Every task's requirements implicitly include all of these:

- UI is pt-BR only. Every user-visible string lives in `src/lib/strings.ts` — no loose strings in JSX. Numbers use decimal comma via `formatVolume`.
- Date math only in `src/lib/dates.ts` and `src/lib/periods.ts`. Timezone fixed `America/Sao_Paulo` (`APP_TZ`). Weeks start Monday.
- Colors only via tokens in `src/styles/tokens.css`. Dark theme only. Flat: no gradients, no glow, no shadows on surfaces.
- TypeScript `strict` + `noUncheckedIndexedAccess`. No `any`.
- A file passing ~200 lines is doing too much — split it.
- Pure logic gets Vitest unit tests, written test-first (TDD).
- Components never import `supabase` directly — data flows through hooks in `src/features/*`.
- `src/lib/database.types.ts` is generated. Never edit by hand.
- `npm run test:run` and `npm run typecheck` must be green before every commit. Never commit with a failing test.
- Touch targets never below 44px.
- **The cloud database is the only database.** M3 needs no migration; if one becomes necessary, create a new one, never edit applied ones. NEVER print or overwrite `.env.local`.
- Simplicity wins. When two designs work, ship the leaner one and say so.

## File Map

**New:**
- `src/lib/idb.ts` + `idb.test.ts` — the only module touching IndexedDB: persister storage adapter + outbox load/save
- `src/features/entries/outbox.ts` + `outbox.test.ts` — pure: op types, `mergeOp`, `backoffMs`, `isFailed`, `statusOf`
- `src/features/entries/outboxStore.ts` + `outboxStore.test.ts` — the live queue: IDB-backed, subscribable, `useOutboxStatus`
- `src/features/entries/flush.ts` + `flush.test.ts` — the flush engine + `isTransientError` + `useOutboxFlush`
- `src/features/entries/sync.ts` + `sync.test.ts` — `runEntriesSync` (incremental read)
- `src/features/entries/queries.test.tsx` — `useEntries` keeps optimistic rows across refetch
- `src/features/entries/offline.test.ts` — integration: enqueue → "restart" → flush syncs
- `src/screens/hoje/SyncPill.tsx` + `SyncPill.test.tsx` — "Sem conexão" / "Dados desatualizados"

**Modified:**
- `package.json` (deps), `src/test/setup.ts` (fake-indexeddb), `src/main.tsx` (PersistQueryClientProvider)
- `src/features/entries/api.ts` — `fetchEntriesSince`, `upsertEntryRow`; `fetchEntries`/`insertEntry` deleted
- `src/features/entries/photos.ts` — `removeEntryPhotos(paths: readonly (string | null)[])`
- `src/features/entries/cache.ts` + `cache.test.ts` — `watermarkOf`, `mergeEntries`
- `src/features/entries/queries.ts` — incremental queryFn; later `useSyncStatus`
- `src/features/entries/realtime.ts` + `realtime.test.tsx` — skip rows with a queued op
- `src/features/entries/mutations.ts` + `mutations.test.tsx` — rewritten: `useEntryOps` (outbox-backed)
- `src/screens/registrar/submit.ts` + `submit.test.ts` — rewritten: pure enqueue, no uploads
- `src/screens/registrar/RegisterSheet.tsx` + `RegisterSheet.test.tsx`
- `src/screens/hoje/RegistersCard.tsx`, `src/screens/hoje/EntryRow.tsx` + `EntryRow.test.tsx`, `src/screens/hoje/Hoje.tsx` + `Hoje.test.tsx`
- `src/app/AppShell.tsx` (+ `AppShell.test.tsx` if needed)
- `src/lib/strings.ts` — `sync` section; `registrar.falhou` removed
- Spec §5.1/§12 (Task 6), `docs/superpowers/plans/ROADMAP.md` (Task 9)

---

### Task 1: Persistence foundation — idb-keyval, lib/idb.ts, persisted query cache

**Files:**
- Modify: `package.json`, `src/test/setup.ts`, `src/main.tsx`
- Create: `src/lib/idb.ts`, `src/lib/idb.test.ts`

**Interfaces:**
- Produces:
  - `idbStorage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> }`
  - `loadOutbox<T>(): Promise<T | undefined>`, `saveOutbox<T>(queue: T): Promise<void>` — Task 3's store binds to these
  - The query cache persists to IndexedDB and survives a reload; `fake-indexeddb` makes `indexedDB` available in every test.

- [ ] **Step 1: Install dependencies**

```bash
npm install idb-keyval @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
npm install -D fake-indexeddb
```

- [ ] **Step 2: Give tests an IndexedDB**

At the very top of `src/test/setup.ts` (before the jest-dom import):

```ts
import 'fake-indexeddb/auto'
```

- [ ] **Step 3: Write the failing test for lib/idb.ts**

`src/lib/idb.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { idbStorage, loadOutbox, saveOutbox } from './idb'

describe('idbStorage', () => {
  it('round-trips a string and returns null for missing keys', async () => {
    await idbStorage.setItem('k', 'valor')
    expect(await idbStorage.getItem('k')).toBe('valor')
    await idbStorage.removeItem('k')
    expect(await idbStorage.getItem('k')).toBeNull()
  })
})

describe('outbox persistence', () => {
  it('round-trips the queue and is undefined before the first save', async () => {
    expect(await loadOutbox()).toBeUndefined()
    const queue = [{ id: 'e1', type: 'insert', attempts: 0 }]
    await saveOutbox(queue)
    expect(await loadOutbox()).toEqual(queue)
  })
})
```

Run: `npx vitest run src/lib/idb.test.ts` — FAIL (module not found).

- [ ] **Step 4: Implement lib/idb.ts**

```ts
import { del, get, set } from 'idb-keyval'

/** All IndexedDB access lives here: the query-cache persister storage and the outbox. */

export const idbStorage = {
  getItem: async (key: string): Promise<string | null> => (await get<string>(key)) ?? null,
  setItem: (key: string, value: string): Promise<void> => set(key, value),
  removeItem: (key: string): Promise<void> => del(key),
}

const OUTBOX_KEY = 'outbox'

/** The queue is one value — trivially FIFO, and Blobs survive the structured clone. */
export function loadOutbox<T>(): Promise<T | undefined> {
  return get<T>(OUTBOX_KEY)
}

export function saveOutbox<T>(queue: T): Promise<void> {
  return set(OUTBOX_KEY, queue)
}
```

Run: `npx vitest run src/lib/idb.test.ts` — PASS.

- [ ] **Step 5: Persist the query cache in main.tsx**

In `src/main.tsx`, replace the `QueryClient` construction and the provider. Change the imports:

```ts
import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { idbStorage } from '@/lib/idb'
```

Replace the `queryClient` declaration with:

```ts
/** How long the offline mirror stays usable without a successful sync. */
const PERSIST_MAX_AGE = 30 * 24 * 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: {
    // gcTime must outlive maxAge or queries get collected before they can persist
    queries: { retry: 1, refetchOnWindowFocus: true, gcTime: PERSIST_MAX_AGE },
  },
})

const persister = createAsyncStoragePersister({ storage: idbStorage })
```

And swap the provider element (children unchanged):

```tsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
>
  …
</PersistQueryClientProvider>
```

(`QueryClientProvider` is no longer imported; `useQueryClient` still is, for `OnboardingRoute`.)

- [ ] **Step 6: Verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.
Run: `npm run dev`, load the app, reload the page — Hoje renders instantly from the persisted cache (network tab shows the entries request happening *after* first paint).

```bash
git add package.json package-lock.json src/test/setup.ts src/main.tsx src/lib/idb.ts src/lib/idb.test.ts
git commit -m "feat: persist the query cache to IndexedDB"
```

---

### Task 2: Outbox pure logic — op types, merging, backoff

**Files:**
- Create: `src/features/entries/outbox.ts`, `src/features/entries/outbox.test.ts`

**Interfaces:**
- Consumes: `TablesInsert<'entries'>` from `@/lib/database.types`, `EntryPatch` from `./api`.
- Produces (Tasks 3–7 rely on these exact names):
  - `MAX_ATTEMPTS = 5`
  - `type OpPhoto = { photo: Blob; thumb: Blob }`
  - `type InsertOp / UpdateOp / DeleteOp / OutboxOp` — discriminated on `type`, each carrying `id` (entry id), `groupId`, `profileId`, `createdAt`, `attempts`, `rev`
  - `type NewOp` — an op without `createdAt`/`attempts`/`rev`
  - `mergeOp(queue: readonly OutboxOp[], op: NewOp, now: number): OutboxOp[]`
  - `backoffMs(attempts: number): number`
  - `isFailed(op: OutboxOp): boolean`
  - `type OutboxStatus = { pending: ReadonlySet<string>; failed: ReadonlySet<string>; queued: ReadonlySet<string> }`
  - `statusOf(queue: readonly OutboxOp[]): OutboxStatus`

- [ ] **Step 1: Write the failing tests**

`src/features/entries/outbox.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TablesInsert } from '@/lib/database.types'
import {
  backoffMs,
  isFailed,
  MAX_ATTEMPTS,
  mergeOp,
  statusOf,
  type NewOp,
  type OutboxOp,
} from './outbox'

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const insertOp: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

function enqueue(queue: readonly OutboxOp[], op: NewOp, now = 1000): OutboxOp[] {
  return mergeOp(queue, op, now)
}

describe('mergeOp', () => {
  it('appends a new op with attempts 0 and rev 0', () => {
    const q = enqueue([], insertOp)
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ type: 'insert', id: 'e1', createdAt: 1000, attempts: 0, rev: 0 })
  })

  it('keeps FIFO: later ops for other entries append after earlier ones', () => {
    const q = enqueue(enqueue([], insertOp, 1000), { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } }, 2000)
    expect(q.map((o) => o.id)).toEqual(['e1', 'e2'])
  })

  it('folds an update into a queued insert, keeping position and bumping rev', () => {
    const q0 = enqueue(enqueue([], insertOp, 1000), { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } }, 2000)
    const q = enqueue(q0, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] }, 3000)
    expect(q.map((o) => o.id)).toEqual(['e1', 'e2'])
    expect(q[0]).toMatchObject({ type: 'insert', createdAt: 1000, rev: 1 })
    expect(q[0]?.type === 'insert' && q[0].row.total_ml).toBe(900)
  })

  it('merges consecutive updates: patches shallow-merge, removePaths union', () => {
    const base = enqueue([], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 700 }, removePaths: ['a.jpg'] })
    const q = enqueue(base, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { note: 'oi' }, removePaths: ['a.jpg', 'b.jpg'] })
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ type: 'update', rev: 1, patch: { total_ml: 700, note: 'oi' }, removePaths: ['a.jpg', 'b.jpg'] })
  })

  it('a new photo replaces the queued one; a patch nulling photo_path clears it', () => {
    const photo1 = { photo: new Blob(['1']), thumb: new Blob(['1t']) }
    const photo2 = { photo: new Blob(['2']), thumb: new Blob(['2t']) }
    const withPhoto = enqueue([], { ...insertOp, photo: photo1 })
    const replaced = enqueue(withPhoto, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: {}, photo: photo2, removePaths: [] })
    expect(replaced[0]?.type === 'insert' && replaced[0].photo).toBe(photo2)
    const cleared = enqueue(withPhoto, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { photo_path: null, thumb_path: null }, removePaths: [] })
    expect(cleared[0]?.type === 'insert' && cleared[0].photo).toBeUndefined()
  })

  it('a delete of a queued insert drops the op entirely — the entry never reached the server', () => {
    const q = enqueue(enqueue([], insertOp), { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: [] })
    expect(q).toEqual([])
  })

  it('a delete of a queued update becomes a delete, keeping removePaths', () => {
    const base = enqueue([], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 700 }, removePaths: ['a.jpg'] })
    const q = enqueue(base, { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: ['b.jpg'] })
    expect(q[0]).toMatchObject({ type: 'delete', rev: 1, patch: { deleted_at: 'x' }, removePaths: ['a.jpg', 'b.jpg'] })
  })

  it('merging resets attempts so an edited op earns fresh tries', () => {
    const failed = { ...enqueue([], insertOp)[0]!, attempts: MAX_ATTEMPTS }
    const q = enqueue([failed], { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] })
    expect(q[0]?.attempts).toBe(0)
  })

  it('anything after a queued delete is ignored', () => {
    const del = enqueue([], { type: 'delete', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { deleted_at: 'x' }, removePaths: [] })
    const q = enqueue(del, { type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 1 }, removePaths: [] })
    expect(q).toEqual(del)
  })
})

describe('backoffMs', () => {
  it('doubles per attempt and caps at 60 s', () => {
    expect(backoffMs(1)).toBe(2000)
    expect(backoffMs(2)).toBe(4000)
    expect(backoffMs(4)).toBe(16000)
    expect(backoffMs(10)).toBe(60000)
  })
})

describe('statusOf / isFailed', () => {
  it('splits ids into pending and failed; queued is the union', () => {
    const ok = enqueue([], insertOp)[0]!
    const bad = { ...enqueue([], { ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })[0]!, attempts: MAX_ATTEMPTS }
    expect(isFailed(ok)).toBe(false)
    expect(isFailed(bad)).toBe(true)
    const s = statusOf([ok, bad])
    expect([...s.pending]).toEqual(['e1'])
    expect([...s.failed]).toEqual(['e2'])
    expect([...s.queued].sort()).toEqual(['e1', 'e2'])
  })
})
```

Run: `npx vitest run src/features/entries/outbox.test.ts` — FAIL.

- [ ] **Step 2: Implement outbox.ts**

```ts
import type { TablesInsert } from '@/lib/database.types'
import type { EntryPatch } from './api'

export const MAX_ATTEMPTS = 5

export type OpPhoto = { photo: Blob; thumb: Blob }

type Meta = {
  /** Entry id — the queue holds at most one op per entry. */
  id: string
  groupId: string
  profileId: string
  createdAt: number
  attempts: number
  /** Bumped on every merge; the flusher only settles or fails the rev it actually sent. */
  rev: number
}

export type InsertOp = Meta & { type: 'insert'; row: TablesInsert<'entries'>; photo?: OpPhoto }
export type UpdateOp = Meta & { type: 'update'; patch: EntryPatch; photo?: OpPhoto; removePaths: string[] }
export type DeleteOp = Meta & { type: 'delete'; patch: EntryPatch; removePaths: string[] }
export type OutboxOp = InsertOp | UpdateOp | DeleteOp

export type NewOp =
  | Omit<InsertOp, 'createdAt' | 'attempts' | 'rev'>
  | Omit<UpdateOp, 'createdAt' | 'attempts' | 'rev'>
  | Omit<DeleteOp, 'createdAt' | 'attempts' | 'rev'>

/** 2s, 4s, 8s, 16s, 32s — capped at 60s (spec §12). */
export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 60_000)
}

export function isFailed(op: OutboxOp): boolean {
  return op.attempts >= MAX_ATTEMPTS
}

export type OutboxStatus = {
  pending: ReadonlySet<string>
  failed: ReadonlySet<string>
  queued: ReadonlySet<string>
}

export function statusOf(queue: readonly OutboxOp[]): OutboxStatus {
  const pending = new Set<string>()
  const failed = new Set<string>()
  for (const op of queue) (isFailed(op) ? failed : pending).add(op.id)
  return { pending, failed, queued: new Set(queue.map((o) => o.id)) }
}

function union(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])]
}

/**
 * FIFO with per-entry merging (spec §12): a later op for a still-queued entry folds into
 * the existing op at its original position, resetting attempts and bumping rev. A delete
 * of a queued insert simply drops the op — the entry never reached the server.
 */
export function mergeOp(queue: readonly OutboxOp[], op: NewOp, now: number): OutboxOp[] {
  const existing = queue.find((o) => o.id === op.id)
  if (!existing) return [...queue, { ...op, createdAt: now, attempts: 0, rev: 0 }]
  if (existing.type === 'delete' || op.type === 'insert') return [...queue]
  if (op.type === 'delete' && existing.type === 'insert') {
    return queue.filter((o) => o.id !== op.id)
  }
  const meta: Meta = { ...pickMeta(existing), attempts: 0, rev: existing.rev + 1 }
  const merged: OutboxOp =
    op.type === 'delete'
      ? { ...meta, type: 'delete', patch: op.patch, removePaths: union(pathsOf(existing), op.removePaths) }
      : existing.type === 'insert'
        ? { ...meta, type: 'insert', row: { ...existing.row, ...op.patch }, ...photoOf(existing, op) }
        : {
            ...meta,
            type: 'update',
            patch: { ...existing.patch, ...op.patch },
            removePaths: union(existing.removePaths, op.removePaths),
            ...photoOf(existing, op),
          }
  return queue.map((o) => (o.id === op.id ? merged : o))
}

function pickMeta(op: OutboxOp): Meta {
  return {
    id: op.id,
    groupId: op.groupId,
    profileId: op.profileId,
    createdAt: op.createdAt,
    attempts: op.attempts,
    rev: op.rev,
  }
}

function pathsOf(op: OutboxOp): string[] {
  return op.type === 'insert' ? [] : op.removePaths
}

/** A new photo replaces the queued one; a patch that nulls photo_path clears it. */
function photoOf(
  existing: InsertOp | UpdateOp,
  op: Omit<UpdateOp, 'createdAt' | 'attempts' | 'rev'>,
): { photo?: OpPhoto } {
  if (op.photo) return { photo: op.photo }
  if ('photo_path' in op.patch) return {}
  return existing.photo ? { photo: existing.photo } : {}
}
```

Run: `npx vitest run src/features/entries/outbox.test.ts` — PASS.

- [ ] **Step 3: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.

```bash
git add src/features/entries/outbox.ts src/features/entries/outbox.test.ts
git commit -m "feat: outbox op types, merging and backoff (pure)"
```

---

### Task 3: Outbox store — the durable, subscribable queue

**Files:**
- Create: `src/features/entries/outboxStore.ts`, `src/features/entries/outboxStore.test.ts`

**Interfaces:**
- Consumes: `loadOutbox`/`saveOutbox` from `@/lib/idb`, everything from `./outbox`.
- Produces:
  - `createOutboxStore(io: { load(): Promise<OutboxOp[] | undefined>; save(queue: OutboxOp[]): Promise<void> })` — the factory (tests inject in-memory io; Task 9's integration test simulates a restart with it)
  - `outboxStore` — the app singleton, bound to `lib/idb`
  - Store methods: `ready(): Promise<void>`, `subscribe(fn: () => void): () => void`, `getStatus(): OutboxStatus`, `enqueue(op: NewOp): Promise<void>`, `claim(skip: ReadonlySet<string>): OutboxOp | undefined`, `settle(id: string, rev: number): void`, `fail(id: string, rev: number): void`, `retry(id: string): Promise<void>`, `nextBackoffMs(): number | undefined`
  - `useOutboxStatus(): OutboxStatus` — for the row UI (Task 7)

- [ ] **Step 1: Write the failing tests**

`src/features/entries/outboxStore.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { TablesInsert } from '@/lib/database.types'
import { MAX_ATTEMPTS, type NewOp, type OutboxOp } from './outbox'
import { createOutboxStore } from './outboxStore'

function memoryIo(seed?: OutboxOp[]) {
  let stored: OutboxOp[] | undefined = seed
  return {
    load: () => Promise.resolve(stored),
    save: (queue: OutboxOp[]) => {
      stored = queue
      return Promise.resolve()
    },
    get stored() {
      return stored
    },
  }
}

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const insertOp: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

describe('outboxStore', () => {
  it('enqueue persists and notifies subscribers with fresh status', async () => {
    const io = memoryIo()
    const store = createOutboxStore(io)
    let notified = 0
    store.subscribe(() => {
      notified += 1
    })
    await store.enqueue(insertOp)
    expect(notified).toBeGreaterThan(0)
    expect(store.getStatus().pending.has('e1')).toBe(true)
    expect(io.stored).toHaveLength(1)
  })

  it('restores the queue saved by a previous instance', async () => {
    const io = memoryIo()
    const a = createOutboxStore(io)
    await a.enqueue(insertOp)
    const b = createOutboxStore(io)
    await b.ready()
    expect(b.claim(new Set())?.id).toBe('e1')
  })

  it('settle removes only the rev that was sent', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    const op = store.claim(new Set())!
    // a merge lands while the send is in flight
    await store.enqueue({ type: 'update', id: 'e1', groupId: 'g1', profileId: 'u1', patch: { total_ml: 900 }, removePaths: [] })
    store.settle(op.id, op.rev)
    expect(store.getStatus().queued.has('e1')).toBe(true)
    const merged = store.claim(new Set())!
    store.settle(merged.id, merged.rev)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('fail increments attempts; at MAX_ATTEMPTS the op stops being claimable; retry revives it', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const op = store.claim(new Set())!
      store.fail(op.id, op.rev)
    }
    expect(store.claim(new Set())).toBeUndefined()
    expect(store.getStatus().failed.has('e1')).toBe(true)
    await store.retry('e1')
    expect(store.claim(new Set())?.id).toBe('e1')
  })

  it('claim skips the given ids and respects FIFO', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    expect(store.claim(new Set(['e1']))?.id).toBe('e2')
  })

  it('nextBackoffMs is the smallest backoff among retryable ops', async () => {
    const store = createOutboxStore(memoryIo())
    await store.enqueue(insertOp)
    expect(store.nextBackoffMs()).toBeUndefined()
    const op = store.claim(new Set())!
    store.fail(op.id, op.rev)
    expect(store.nextBackoffMs()).toBe(2000)
  })
})
```

Run: `npx vitest run src/features/entries/outboxStore.test.ts` — FAIL.

- [ ] **Step 2: Implement outboxStore.ts**

```ts
import { useSyncExternalStore } from 'react'
import { loadOutbox, saveOutbox } from '@/lib/idb'
import {
  backoffMs,
  isFailed,
  mergeOp,
  statusOf,
  type NewOp,
  type OutboxOp,
  type OutboxStatus,
} from './outbox'

export type OutboxIo = {
  load: () => Promise<OutboxOp[] | undefined>
  save: (queue: OutboxOp[]) => Promise<void>
}

export function createOutboxStore(io: OutboxIo) {
  let queue: readonly OutboxOp[] = []
  let status: OutboxStatus = statusOf(queue)
  const listeners = new Set<() => void>()
  let readyPromise: Promise<void> | null = null

  function commit(next: readonly OutboxOp[]): void {
    queue = next
    status = statusOf(next)
    for (const listener of listeners) listener()
    // the in-memory queue keeps working this session even if the IDB write fails
    void io.save([...next]).catch(() => {})
  }

  function ready(): Promise<void> {
    readyPromise ??= io.load().then((stored) => {
      if (stored && stored.length > 0) commit(stored)
    })
    return readyPromise
  }

  return {
    ready,
    subscribe(fn: () => void): () => void {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    getStatus: (): OutboxStatus => status,
    async enqueue(op: NewOp): Promise<void> {
      await ready()
      commit(mergeOp(queue, op, Date.now()))
    },
    /** First op that is neither failed nor in `skip` — FIFO. */
    claim(skip: ReadonlySet<string>): OutboxOp | undefined {
      return queue.find((op) => !isFailed(op) && !skip.has(op.id))
    },
    /** Remove after a successful send — unless a merge changed the op mid-flight. */
    settle(id: string, rev: number): void {
      const op = queue.find((o) => o.id === id)
      if (op?.rev === rev) commit(queue.filter((o) => o.id !== id))
    },
    fail(id: string, rev: number): void {
      const op = queue.find((o) => o.id === id)
      if (op?.rev === rev) commit(queue.map((o) => (o.id === id ? { ...o, attempts: o.attempts + 1 } : o)))
    },
    async retry(id: string): Promise<void> {
      await ready()
      commit(queue.map((o) => (o.id === id ? { ...o, attempts: 0 } : o)))
    },
    nextBackoffMs(): number | undefined {
      const waiting = queue.filter((o) => o.attempts > 0 && !isFailed(o))
      if (waiting.length === 0) return undefined
      return Math.min(...waiting.map((o) => backoffMs(o.attempts)))
    },
  }
}

export type OutboxStore = ReturnType<typeof createOutboxStore>

export const outboxStore: OutboxStore = createOutboxStore({
  load: () => loadOutbox<OutboxOp[]>(),
  save: (queue) => saveOutbox(queue),
})

export function useOutboxStatus(): OutboxStatus {
  return useSyncExternalStore(outboxStore.subscribe, outboxStore.getStatus)
}
```

Run: `npx vitest run src/features/entries/outboxStore.test.ts` — PASS.

- [ ] **Step 3: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.

```bash
git add src/features/entries/outboxStore.ts src/features/entries/outboxStore.test.ts
git commit -m "feat: durable outbox store over IndexedDB"
```

---

### Task 4: Flush engine — send loop, transient vs server errors, backoff timers

**Files:**
- Modify: `src/features/entries/api.ts`, `src/features/entries/photos.ts`, `src/screens/registrar/submit.ts` (mechanical), `src/screens/hoje/RegistersCard.tsx` (mechanical), `src/screens/registrar/submit.test.ts` (one assertion)
- Create: `src/features/entries/flush.ts`, `src/features/entries/flush.test.ts`

**Interfaces:**
- Consumes: the store (Task 3), `uploadEntryPhoto` from `./photos`, `onlineManager` from `@tanstack/react-query`.
- Produces:
  - `fetchEntriesSince(groupId: string, since: string | undefined): Promise<Entry[]>` — includes soft-deleted rows, ordered `updated_at` ascending (Task 5 consumes)
  - `upsertEntryRow(row: TablesInsert<'entries'>): Promise<void>` — idempotent insert (client-generated ids, spec §12)
  - `removeEntryPhotos(paths: readonly (string | null)[]): void` — best-effort, never throws (new signature)
  - `flushOutbox(client: QueryClient, store?: OutboxStore): Promise<void>`
  - `isTransientError(e: unknown): boolean`
  - `useOutboxFlush(): void` — start/visibilitychange/online triggers (mounted in Task 9)

- [ ] **Step 1: Extend api.ts**

Add to `src/features/entries/api.ts` (keep `fetchEntries` and `insertEntry` for now — Tasks 5 and 6 delete them when their callers move):

```ts
/**
 * Watermark read (spec §12): everything that changed since `since`, INCLUDING soft-deleted
 * rows — that is what makes deletions sync. Ordered ascending so the newest lands last.
 */
export async function fetchEntriesSince(groupId: string, since: string | undefined): Promise<Entry[]> {
  let query = supabase.from('entries').select('*').eq('group_id', groupId)
  if (since !== undefined) query = query.gt('updated_at', since)
  const { data, error } = await query.order('updated_at', { ascending: true })
  if (error) throw error
  return data
}

/** Entry ids are client-generated, so a re-sent insert is an idempotent upsert (spec §12). */
export async function upsertEntryRow(row: TablesInsert<'entries'>): Promise<void> {
  const { error } = await supabase.from('entries').upsert(row)
  if (error) throw error
}
```

- [ ] **Step 2: Simplify removeEntryPhotos to take a path list**

In `src/features/entries/photos.ts`, replace `removeEntryPhotos` with:

```ts
/** Best-effort: an orphaned object costs nothing (spec §13 step 7). Never throws. */
export function removeEntryPhotos(paths: readonly (string | null)[]): void {
  const found = paths.filter((p): p is string => Boolean(p))
  if (found.length === 0) return
  void supabase.storage
    .from('photos')
    .remove(found)
    .catch(() => {})
}
```

Update the two existing callers mechanically:
- `src/screens/registrar/submit.ts` line ~51: `removeEntryPhotos(entry.photo_path, entry.thumb_path)` → `removeEntryPhotos([entry.photo_path, entry.thumb_path])`
- `src/screens/hoje/RegistersCard.tsx` line ~47: same change.
- `src/screens/registrar/submit.test.ts` line ~82: `toHaveBeenCalledWith('g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg')` → `toHaveBeenCalledWith(['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'])`

Run: `npm run test:run` — still green.

- [ ] **Step 3: Write the failing tests for flush.ts**

`src/features/entries/flush.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager, QueryClient } from '@tanstack/react-query'
import type { TablesInsert } from '@/lib/database.types'
import { MAX_ATTEMPTS, type NewOp, type OutboxOp } from './outbox'
import { createOutboxStore } from './outboxStore'
import { flushOutbox, isTransientError } from './flush'

const api = vi.hoisted(() => ({
  upsertEntryRow: vi.fn(),
  updateEntry: vi.fn(),
  fetchEntriesSince: vi.fn(),
  fetchEntries: vi.fn(),
  insertEntry: vi.fn(),
}))
vi.mock('./api', () => api)
const photos = vi.hoisted(() => ({
  uploadEntryPhoto: vi.fn(),
  removeEntryPhotos: vi.fn(),
}))
vi.mock('./photos', () => photos)

function memoryIo() {
  let stored: OutboxOp[] | undefined
  return {
    load: () => Promise.resolve(stored),
    save: (queue: OutboxOp[]) => {
      stored = queue
      return Promise.resolve()
    },
  }
}

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const insertOp: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

function harness() {
  const store = createOutboxStore(memoryIo())
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { store, client }
}

describe('flushOutbox', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    onlineManager.setOnline(true)
    api.upsertEntryRow.mockReset().mockResolvedValue(undefined)
    api.updateEntry.mockReset().mockResolvedValue(undefined)
    photos.uploadEntryPhoto.mockReset()
    photos.removeEntryPhotos.mockReset()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('sends an insert and settles the op', async () => {
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).toHaveBeenCalledWith(row)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('uploads photos first and writes the row with the returned paths', async () => {
    photos.uploadEntryPhoto.mockResolvedValue({ photoPath: 'g1/u1/e1.jpg', thumbPath: 'g1/u1/e1_thumb.jpg' })
    const { store, client } = harness()
    await store.enqueue({ ...insertOp, photo: { photo: new Blob(['p']), thumb: new Blob(['t']) } })
    await flushOutbox(client, store)
    expect(photos.uploadEntryPhoto).toHaveBeenCalled()
    expect(api.upsertEntryRow).toHaveBeenCalledWith({
      ...row,
      photo_path: 'g1/u1/e1.jpg',
      thumb_path: 'g1/u1/e1_thumb.jpg',
    })
  })

  it('a failed photo upload keeps the op — the row write never happens without its photo', async () => {
    photos.uploadEntryPhoto.mockRejectedValue(new Error('boom'))
    const { store, client } = harness()
    await store.enqueue({ ...insertOp, photo: { photo: new Blob(['p']), thumb: new Blob(['t']) } })
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(store.claim(new Set())?.attempts).toBe(1)
  })

  it('does nothing while offline — attempts are never burned in airplane mode', async () => {
    onlineManager.setOnline(false)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(store.claim(new Set())?.attempts).toBe(0)
  })

  it('a network error while apparently online stops the pass without counting attempts', async () => {
    api.upsertEntryRow.mockRejectedValue(new TypeError('Failed to fetch'))
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).toHaveBeenCalledTimes(1)
    expect(store.claim(new Set())?.attempts).toBe(0)
  })

  it('a server rejection counts an attempt and moves on to the next op', async () => {
    api.upsertEntryRow.mockRejectedValueOnce({ message: 'violates check constraint' }).mockResolvedValue(undefined)
    const { store, client } = harness()
    await store.enqueue(insertOp)
    await store.enqueue({ ...insertOp, id: 'e2', row: { ...row, id: 'e2' } })
    await flushOutbox(client, store)
    expect(store.getStatus().queued.has('e1')).toBe(true)
    expect(store.getStatus().queued.has('e2')).toBe(false)
  })

  it('after MAX_ATTEMPTS the op is failed and untouched by later flushes until retry', async () => {
    api.upsertEntryRow.mockRejectedValue({ message: 'rls' })
    const { store, client } = harness()
    await store.enqueue(insertOp)
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) await flushOutbox(client, store)
    expect(store.getStatus().failed.has('e1')).toBe(true)
    api.upsertEntryRow.mockClear()
    await flushOutbox(client, store)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    await store.retry('e1')
    api.upsertEntryRow.mockResolvedValue(undefined)
    await flushOutbox(client, store)
    expect(store.getStatus().queued.size).toBe(0)
  })

  it('a delete sends the patch and then removes the storage objects', async () => {
    const { store, client } = harness()
    await store.enqueue({
      type: 'delete',
      id: 'e1',
      groupId: 'g1',
      profileId: 'u1',
      patch: { deleted_at: '2026-09-06T13:00:00.000Z' },
      removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'],
    })
    await flushOutbox(client, store)
    expect(api.updateEntry).toHaveBeenCalledWith('e1', { deleted_at: '2026-09-06T13:00:00.000Z' })
    expect(photos.removeEntryPhotos).toHaveBeenCalledWith(['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'])
  })
})

describe('isTransientError', () => {
  it('classifies network and auth errors as transient, server rejections as real', () => {
    onlineManager.setOnline(true)
    expect(isTransientError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isTransientError({ message: 'JWT expired' })).toBe(true)
    expect(isTransientError({ message: 'new row violates row-level security' })).toBe(false)
    onlineManager.setOnline(false)
    expect(isTransientError({ message: 'anything' })).toBe(true)
    onlineManager.setOnline(true)
  })
})
```

Run: `npx vitest run src/features/entries/flush.test.ts` — FAIL.

- [ ] **Step 4: Implement flush.ts**

```ts
import { useEffect } from 'react'
import { onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { updateEntry, upsertEntryRow } from './api'
import { entriesKey } from './cache'
import type { OutboxOp } from './outbox'
import { outboxStore, type OutboxStore } from './outboxStore'
import { removeEntryPhotos, uploadEntryPhoto } from './photos'

/** Retry cadence after a network failure that happened while apparently online. */
const NETWORK_RETRY_MS = 30_000

let running = false
let again = false
let timer: ReturnType<typeof setTimeout> | undefined

function messageOf(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e !== null && typeof e === 'object' && 'message' in e) return String(e.message)
  return String(e)
}

/**
 * Being offline or logged out is a wait, not a failure (spec §14): transient errors never
 * count toward the 5-attempt cap — the op just waits for the next flush trigger.
 */
export function isTransientError(e: unknown): boolean {
  if (!onlineManager.isOnline()) return true
  return e instanceof TypeError || /fetch|network|jwt|401/i.test(messageOf(e))
}

/** Photos upload first; the row write only ever goes out carrying their paths (spec §12). */
async function send(op: OutboxOp): Promise<void> {
  if (op.type === 'insert') {
    let row = op.row
    if (op.photo) {
      const paths = await uploadEntryPhoto(op.groupId, op.profileId, op.id, op.photo.photo, op.photo.thumb)
      row = { ...row, photo_path: paths.photoPath, thumb_path: paths.thumbPath }
    }
    await upsertEntryRow(row)
    return
  }
  let patch = op.patch
  if (op.type === 'update' && op.photo) {
    const paths = await uploadEntryPhoto(op.groupId, op.profileId, op.id, op.photo.photo, op.photo.thumb)
    patch = { ...patch, photo_path: paths.photoPath, thumb_path: paths.thumbPath }
  }
  await updateEntry(op.id, patch)
  removeEntryPhotos(op.removePaths)
}

/**
 * Drain the queue head-first. Server rejections count an attempt and skip to the next op;
 * transient errors end the pass (everything after would fail the same way). Re-entrant
 * calls coalesce into one extra pass.
 */
export async function flushOutbox(client: QueryClient, store: OutboxStore = outboxStore): Promise<void> {
  if (running) {
    again = true
    return
  }
  running = true
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
  const flushedGroups = new Set<string>()
  let sawNetworkError = false
  try {
    await store.ready()
    const skip = new Set<string>()
    while (onlineManager.isOnline()) {
      const op = store.claim(skip)
      if (!op) break
      try {
        await send(op)
        store.settle(op.id, op.rev)
        flushedGroups.add(op.groupId)
      } catch (e) {
        if (isTransientError(e)) {
          sawNetworkError = onlineManager.isOnline()
          break
        }
        store.fail(op.id, op.rev)
        skip.add(op.id)
      }
    }
    for (const groupId of flushedGroups) {
      await client.invalidateQueries({ queryKey: entriesKey(groupId) })
    }
  } finally {
    running = false
  }
  if (again) {
    again = false
    return flushOutbox(client, store)
  }
  const wait = sawNetworkError ? NETWORK_RETRY_MS : store.nextBackoffMs()
  if (wait !== undefined) {
    timer = setTimeout(() => void flushOutbox(client, store), wait)
  }
}

/**
 * Flush triggers (spec §9/§12): app start, visibilitychange → visible, online. The
 * "after each mutation" trigger lives in the enqueue path. Mounted inside Guard, so
 * the Supabase session is already restored before the first send.
 */
export function useOutboxFlush(): void {
  const client = useQueryClient()
  useEffect(() => {
    void flushOutbox(client)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void flushOutbox(client)
    }
    const onOnline = () => void flushOutbox(client)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [client])
}
```

Run: `npx vitest run src/features/entries/flush.test.ts` — PASS.

- [ ] **Step 5: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.

```bash
git add src/features/entries/api.ts src/features/entries/photos.ts src/features/entries/flush.ts src/features/entries/flush.test.ts src/screens/registrar/submit.ts src/screens/registrar/submit.test.ts src/screens/hoje/RegistersCard.tsx
git commit -m "feat: outbox flush engine with retry and backoff"
```

---

### Task 5: Incremental reads — mirror watermark, merge, sync-as-queryFn, realtime guard

**Files:**
- Modify: `src/features/entries/cache.ts`, `src/features/entries/cache.test.ts`, `src/features/entries/queries.ts`, `src/features/entries/realtime.ts`, `src/features/entries/realtime.test.tsx`, `src/features/entries/mutations.ts` (one-line optimistic change), `src/features/entries/api.ts` (delete `fetchEntries`)
- Create: `src/features/entries/sync.ts`, `src/features/entries/sync.test.ts`, `src/features/entries/queries.test.tsx`

**Interfaces:**
- Consumes: `fetchEntriesSince` (Task 4), `outboxStore` (Task 3).
- Produces:
  - `watermarkOf(list: readonly Entry[]): string | undefined` — max non-empty `updated_at`, compared as strings (they round-trip to the server verbatim, keeping microsecond precision `Date` would drop)
  - `mergeEntries(list: readonly Entry[], rows: readonly Entry[], queued: ReadonlySet<string>): Entry[]`
  - `runEntriesSync(deps: { groupId: string; prev: readonly Entry[]; queued: ReadonlySet<string>; fetchSince: (groupId: string, since: string | undefined) => Promise<Entry[]> }): Promise<Entry[]>`
  - **Convention consumed by Tasks 6–7:** optimistic rows carry `updated_at: ''`, so client clocks never pollute the watermark.
  - `useEntries` keeps its signature; every refetch is now an incremental merge, so optimistic pending rows survive focus refetches.

- [ ] **Step 1: Write failing tests for the cache helpers**

Append to `src/features/entries/cache.test.ts` (it already has a `makeEntry(overrides)` helper — reuse it):

```ts
import { mergeEntries, watermarkOf } from './cache'

describe('watermarkOf', () => {
  it('returns the max updated_at, ignoring optimistic rows (empty updated_at)', () => {
    const list = [
      makeEntry({ id: 'a', updated_at: '2026-09-05T10:00:00.2+00:00' }),
      makeEntry({ id: 'b', updated_at: '2026-09-05T10:00:00.11+00:00' }),
      makeEntry({ id: 'c', updated_at: '' }),
    ]
    expect(watermarkOf(list)).toBe('2026-09-05T10:00:00.2+00:00')
  })
  it('is undefined for an empty or all-optimistic mirror', () => {
    expect(watermarkOf([])).toBeUndefined()
    expect(watermarkOf([makeEntry({ updated_at: '' })])).toBeUndefined()
  })
})

describe('mergeEntries', () => {
  it('upserts server rows, drops soft-deleted, keeps newest-first by drank_at', () => {
    const prev = [makeEntry({ id: 'a', drank_at: '2026-09-01T12:00:00+00:00' })]
    const rows = [
      makeEntry({ id: 'b', drank_at: '2026-09-02T12:00:00+00:00' }),
      makeEntry({ id: 'a', deleted_at: '2026-09-02T13:00:00+00:00' }),
    ]
    expect(mergeEntries(prev, rows, new Set()).map((e) => e.id)).toEqual(['b'])
  })
  it('rows with a queued op keep their optimistic state', () => {
    const prev = [makeEntry({ id: 'a', total_ml: 900, updated_at: '' })]
    const rows = [makeEntry({ id: 'a', total_ml: 500 })]
    expect(mergeEntries(prev, rows, new Set(['a']))[0]?.total_ml).toBe(900)
  })
})
```

Run: `npx vitest run src/features/entries/cache.test.ts` — FAIL.

- [ ] **Step 2: Implement the cache helpers**

Append to `src/features/entries/cache.ts`:

```ts
/**
 * Newest server-authored change in the mirror — the incremental-sync watermark.
 * Optimistic rows carry `updated_at: ''` and never advance it, so client clocks can't
 * hide server rows. Compared as strings on purpose: values round-trip to the server
 * verbatim, keeping microsecond precision that Date.parse would drop.
 */
export function watermarkOf(list: readonly Entry[]): string | undefined {
  let max: string | undefined
  for (const e of list) {
    if (e.updated_at !== '' && (max === undefined || e.updated_at > max)) max = e.updated_at
  }
  return max
}

/** Server rows merge into the mirror; rows with a queued op keep their optimistic state. */
export function mergeEntries(
  list: readonly Entry[],
  rows: readonly Entry[],
  queued: ReadonlySet<string>,
): Entry[] {
  let next: readonly Entry[] = list
  for (const row of rows) {
    if (queued.has(row.id)) continue
    next = upsertEntry(next, row)
  }
  return next as Entry[]
}
```

Run: `npx vitest run src/features/entries/cache.test.ts` — PASS.

- [ ] **Step 3: Write the failing test for runEntriesSync**

`src/features/entries/sync.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import type { Entry } from './cache'
import { runEntriesSync } from './sync'

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'e1',
    profile_id: 'u1',
    group_id: 'g1',
    total_ml: 500,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: '2026-09-01T12:00:00+00:00',
    drank_on: '2026-09-01',
    created_at: '2026-09-01T12:00:00+00:00',
    updated_at: '2026-09-01T12:00:00+00:00',
    deleted_at: null,
    ...overrides,
  }
}

describe('runEntriesSync', () => {
  it('fetches from the mirror watermark and merges, skipping queued ids', async () => {
    const prev = [
      makeEntry({ id: 'a', updated_at: '2026-09-05T10:00:00+00:00' }),
      makeEntry({ id: 'pending', updated_at: '', total_ml: 900 }),
    ]
    const fetchSince = vi.fn().mockResolvedValue([
      makeEntry({ id: 'b', drank_at: '2026-09-06T09:00:00+00:00', updated_at: '2026-09-06T09:00:01+00:00' }),
      makeEntry({ id: 'pending', total_ml: 100, updated_at: '2026-09-06T09:00:02+00:00' }),
    ])
    const merged = await runEntriesSync({
      groupId: 'g1',
      prev,
      queued: new Set(['pending']),
      fetchSince,
    })
    expect(fetchSince).toHaveBeenCalledWith('g1', '2026-09-05T10:00:00+00:00')
    expect(merged.find((e) => e.id === 'pending')?.total_ml).toBe(900)
    expect(merged.some((e) => e.id === 'b')).toBe(true)
  })

  it('passes undefined on first sync so everything is fetched', async () => {
    const fetchSince = vi.fn().mockResolvedValue([])
    await runEntriesSync({ groupId: 'g1', prev: [], queued: new Set(), fetchSince })
    expect(fetchSince).toHaveBeenCalledWith('g1', undefined)
  })
})
```

Run: `npx vitest run src/features/entries/sync.test.ts` — FAIL.

- [ ] **Step 4: Implement sync.ts**

```ts
import { mergeEntries, watermarkOf, type Entry } from './cache'

export type SyncDeps = {
  groupId: string
  prev: readonly Entry[]
  queued: ReadonlySet<string>
  fetchSince: (groupId: string, since: string | undefined) => Promise<Entry[]>
}

/**
 * Incremental read sync (spec §12): fetch rows changed since the newest server timestamp
 * already in the mirror, merge by id, drop soft-deleted. The watermark is derived from
 * the mirror itself, so after a crash it can never run ahead of what was persisted.
 */
export async function runEntriesSync({ groupId, prev, queued, fetchSince }: SyncDeps): Promise<Entry[]> {
  const rows = await fetchSince(groupId, watermarkOf(prev))
  return mergeEntries(prev, rows, queued)
}
```

Run: `npx vitest run src/features/entries/sync.test.ts` — PASS.

- [ ] **Step 5: Make the sync the queryFn**

Replace `src/features/entries/queries.ts` with:

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchEntriesSince } from './api'
import { entriesKey, type Entry } from './cache'
import { outboxStore } from './outboxStore'
import { runEntriesSync } from './sync'

/**
 * The queryFn IS the incremental sync: TanStack's mount/focus/reconnect refetching
 * gives us the spec §12 read triggers, and merging (never replacing) means optimistic
 * outbox rows survive every refetch.
 */
export function useEntries(groupId: string | null | undefined) {
  const client = useQueryClient()
  return useQuery({
    queryKey: entriesKey(groupId ?? 'none'),
    enabled: Boolean(groupId),
    queryFn: async () => {
      await outboxStore.ready()
      return runEntriesSync({
        groupId: groupId!,
        prev: client.getQueryData<Entry[]>(entriesKey(groupId!)) ?? [],
        queued: outboxStore.getStatus().queued,
        fetchSince: fetchEntriesSince,
      })
    },
  })
}
```

Delete `fetchEntries` from `src/features/entries/api.ts` (no callers remain).

- [ ] **Step 6: Test that useEntries preserves optimistic rows**

Create `src/features/entries/queries.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import { useEntries } from './queries'

const api = vi.hoisted(() => ({ fetchEntriesSince: vi.fn() }))
vi.mock('./api', () => api)
const queued = vi.hoisted(() => new Set<string>())
vi.mock('./outboxStore', () => ({
  outboxStore: {
    ready: () => Promise.resolve(),
    getStatus: () => ({ pending: queued, failed: new Set<string>(), queued }),
  },
}))

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'e1',
    profile_id: 'u1',
    group_id: 'g1',
    total_ml: 500,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: '2026-09-01T12:00:00+00:00',
    drank_on: '2026-09-01',
    created_at: '2026-09-01T12:00:00+00:00',
    updated_at: '2026-09-01T12:00:00+00:00',
    deleted_at: null,
    ...overrides,
  }
}

describe('useEntries', () => {
  it('refetches incrementally from the watermark and keeps optimistic rows', async () => {
    queued.clear()
    queued.add('pending')
    const synced = makeEntry({ id: 'synced', drank_at: '2026-09-05T08:00:00+00:00', updated_at: '2026-09-05T10:00:00+00:00' })
    const optimistic = makeEntry({ id: 'pending', drank_at: '2026-09-06T09:00:00+00:00', updated_at: '' })
    api.fetchEntriesSince.mockResolvedValue([
      makeEntry({ id: 'partner', drank_at: '2026-09-06T08:00:00+00:00', updated_at: '2026-09-05T11:00:00+00:00' }),
    ])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(entriesKey('g1'), [optimistic, synced])
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useEntries('g1'), { wrapper })
    await waitFor(() => expect(api.fetchEntriesSince).toHaveBeenCalled())
    expect(api.fetchEntriesSince).toHaveBeenCalledWith('g1', '2026-09-05T10:00:00+00:00')
    await waitFor(() =>
      expect(result.current.data?.map((e) => e.id)).toEqual(['pending', 'partner', 'synced']),
    )
  })
})
```

Run: `npx vitest run src/features/entries/queries.test.tsx` — PASS.

- [ ] **Step 7: Realtime skips rows with a queued op**

In `src/features/entries/realtime.ts`, import the store and guard the handler:

```ts
import { outboxStore } from './outboxStore'
```

Inside the payload handler, right after the `if (!row || typeof row.id !== 'string') return` line:

```ts
// a queued local op owns this row's optimistic state; the post-flush sync will reconcile
if (outboxStore.getStatus().queued.has(row.id)) return
```

In `src/features/entries/realtime.test.tsx`, add a mutable mock at the top (alongside the existing supabase mock):

```tsx
const queuedIds = vi.hoisted(() => new Set<string>())
vi.mock('./outboxStore', () => ({
  outboxStore: { getStatus: () => ({ pending: queuedIds, failed: new Set<string>(), queued: queuedIds }) },
}))
```

Add `queuedIds.clear()` to the existing `beforeEach`, then add this test (the file's `handlers` array and `row` fixture already exist):

```tsx
it('ignores realtime rows that have a queued outbox op', () => {
  const { client, wrapper } = harness()
  const optimistic = { ...row, total_ml: 900, updated_at: '' }
  client.setQueryData(entriesKey('g1'), [optimistic])
  queuedIds.add(row.id)
  renderHook(() => useRealtimeEntries('g1'), { wrapper })
  handlers[0]?.({ new: { ...row, total_ml: 500 } })
  expect(client.getQueryData<Entry[]>(entriesKey('g1'))?.[0]?.total_ml).toBe(900)
})
```

- [ ] **Step 8: Optimistic rows stop carrying client clocks**

In `src/features/entries/mutations.ts` (still the M2 version), inside `optimisticRow`, replace

```ts
    created_at: now,
    updated_at: now,
```

with

```ts
    created_at: now,
    // '' marks the row optimistic: the sync watermark ignores it (see cache.watermarkOf)
    updated_at: '',
```

and in `useUpdateEntry`'s `onMutate`, replace `updated_at: new Date().toISOString(),` with `updated_at: '',`.

- [ ] **Step 9: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.

```bash
git add src/features/entries
git commit -m "feat: incremental watermark sync for entries"
```

---

### Task 6: Writes go through the outbox — mutations, submit, sheet, delete

This task swaps the write path and updates the spec for the two deviations. It touches many files but is one reviewable unit: before it, writes are direct mutations; after it, every write is an outbox op.

**Files:**
- Rewrite: `src/features/entries/mutations.ts`, `src/features/entries/mutations.test.tsx`, `src/screens/registrar/submit.ts`, `src/screens/registrar/submit.test.ts`
- Modify: `src/screens/registrar/RegisterSheet.tsx`, `src/screens/registrar/RegisterSheet.test.tsx`, `src/screens/hoje/RegistersCard.tsx`, `src/screens/hoje/Hoje.test.tsx`, `src/features/entries/api.ts` (delete `insertEntry`), `src/lib/strings.ts` (delete `registrar.falhou`)
- Modify: `docs/superpowers/specs/2026-08-11-gymfishes-design.md` (§5.1, §12)

**Interfaces:**
- Consumes: `outboxStore.enqueue/retry` (Task 3), `flushOutbox` (Task 4), `updated_at: ''` convention (Task 5).
- Produces:
  - `type NewEntry = { id: string; profileId: string; totalMl: number; composition: CompositionItem[]; note: string | null; drankAt: Date; photo: OpPhoto | null }` (photo paths are gone — the flusher fills them)
  - `useEntryOps(groupId: string, profileId: string)` → `{ insert(input: NewEntry): void; update(entry: Entry, patch: EntryPatch, photo?: OpPhoto): void; remove(entry: Entry): void; retry(entryId: string): void }`
  - `type EntryOps = ReturnType<typeof useEntryOps>`
  - `submitDraft(ops: Pick<EntryOps, 'insert' | 'update'>, userId: string, draft: Draft, entry: Entry | undefined): void`
  - `useInsertEntry`/`useUpdateEntry` no longer exist.

- [ ] **Step 1: Write the failing tests (rewrite mutations.test.tsx)**

Replace `src/features/entries/mutations.test.tsx` entirely:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { entriesKey, type Entry } from './cache'
import type { NewOp } from './outbox'
import { useEntryOps, type NewEntry } from './mutations'

const store = vi.hoisted(() => ({
  enqueue: vi.fn<(op: NewOp) => Promise<void>>(),
  retry: vi.fn<(id: string) => Promise<void>>(),
}))
vi.mock('./outboxStore', () => ({ outboxStore: store }))
const flush = vi.hoisted(() => ({ flushOutbox: vi.fn() }))
vi.mock('./flush', () => flush)

const existing: Entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  photo_path: 'g1/u1/e1.jpg',
  thumb_path: 'g1/u1/e1_thumb.jpg',
  drank_at: '2026-09-01T10:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  deleted_at: null,
}

const novo: NewEntry = {
  id: 'e2',
  profileId: 'u1',
  totalMl: 300,
  composition: [],
  note: null,
  drankAt: new Date('2026-09-01T12:00:00Z'),
  photo: null,
}

function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(entriesKey('g1'), [existing])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useEntryOps('g1', 'u1'), { wrapper })
  return { client, ops: result.current }
}

describe('useEntryOps', () => {
  beforeEach(() => {
    store.enqueue.mockReset().mockResolvedValue(undefined)
    store.retry.mockReset().mockResolvedValue(undefined)
    flush.flushOutbox.mockReset()
  })

  it('insert patches the cache optimistically (updated_at empty) and enqueues + flushes', async () => {
    const { client, ops } = harness()
    ops.insert(novo)
    await waitFor(() => {
      const list = client.getQueryData<Entry[]>(entriesKey('g1'))
      expect(list?.map((e) => e.id)).toEqual(['e2', 'e1'])
      expect(list?.[0]?.updated_at).toBe('')
    })
    await waitFor(() => expect(flush.flushOutbox).toHaveBeenCalled())
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'insert',
        id: 'e2',
        groupId: 'g1',
        profileId: 'u1',
        row: expect.objectContaining({ id: 'e2', total_ml: 300, group_id: 'g1' }),
      }),
    )
  })

  it('update merges the patch, recomputes drank_on, and enqueues an update op', async () => {
    const { client, ops } = harness()
    ops.update(existing, { total_ml: 900, drank_at: '2026-08-30T15:00:00Z' })
    await waitFor(() => {
      const row = client.getQueryData<Entry[]>(entriesKey('g1'))?.find((e) => e.id === 'e1')
      expect(row?.total_ml).toBe(900)
      expect(row?.drank_on).toBe('2026-08-30')
      expect(row?.updated_at).toBe('')
    })
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'update', id: 'e1', removePaths: [] }),
    )
  })

  it('removing the photo carries the old storage paths for cleanup', async () => {
    const { ops } = harness()
    ops.update(existing, { photo_path: null, thumb_path: null })
    await waitFor(() =>
      expect(store.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'] }),
      ),
    )
  })

  it('remove drops the row optimistically and enqueues a delete with the paths', async () => {
    const { client, ops } = harness()
    ops.remove(existing)
    await waitFor(() => expect(client.getQueryData<Entry[]>(entriesKey('g1'))).toEqual([]))
    expect(store.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delete',
        id: 'e1',
        patch: expect.objectContaining({ deleted_at: expect.any(String) }),
        removePaths: ['g1/u1/e1.jpg', 'g1/u1/e1_thumb.jpg'],
      }),
    )
  })

  it('retry resets attempts and flushes', async () => {
    const { ops } = harness()
    ops.retry('e1')
    await waitFor(() => expect(flush.flushOutbox).toHaveBeenCalled())
    expect(store.retry).toHaveBeenCalledWith('e1')
  })
})
```

Run: `npx vitest run src/features/entries/mutations.test.tsx` — FAIL.

- [ ] **Step 2: Rewrite mutations.ts**

Replace `src/features/entries/mutations.ts` entirely:

```ts
import { useMemo } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CompositionItem } from '@/lib/composition'
import { dayKey } from '@/lib/dates'
import type { TablesInsert } from '@/lib/database.types'
import type { EntryPatch } from './api'
import { entriesKey, removeEntry, upsertEntry, type Entry } from './cache'
import { flushOutbox } from './flush'
import type { NewOp, OpPhoto } from './outbox'
import { outboxStore } from './outboxStore'

export type { EntryPatch }

export type NewEntry = {
  id: string
  profileId: string
  totalMl: number
  composition: CompositionItem[]
  note: string | null
  drankAt: Date
  photo: OpPhoto | null
}

function toRow(input: NewEntry, groupId: string): TablesInsert<'entries'> {
  return {
    id: input.id,
    profile_id: input.profileId,
    group_id: groupId,
    total_ml: input.totalMl,
    composition: input.composition as TablesInsert<'entries'>['composition'],
    note: input.note,
    drank_at: input.drankAt.toISOString(),
    // photo_path/thumb_path omitted: the flusher fills them in after the upload
    // drank_on omitted: DB default + trigger own it
  }
}

/** updated_at '' marks the row optimistic: the sync watermark ignores it (cache.watermarkOf). */
function optimisticRow(input: NewEntry, groupId: string): Entry {
  return {
    ...toRow(input, groupId),
    composition: input.composition as Entry['composition'],
    note: input.note,
    photo_path: null,
    thumb_path: null,
    drank_on: dayKey(input.drankAt),
    created_at: new Date().toISOString(),
    updated_at: '',
    deleted_at: null,
  } as Entry
}

async function patchAndEnqueue(
  client: QueryClient,
  groupId: string,
  apply: (list: readonly Entry[]) => Entry[],
  op: NewOp,
): Promise<void> {
  await client.cancelQueries({ queryKey: entriesKey(groupId) })
  const list = client.getQueryData<Entry[]>(entriesKey(groupId)) ?? []
  client.setQueryData(entriesKey(groupId), apply(list))
  await outboxStore.enqueue(op)
  void flushOutbox(client)
}

function storagePaths(entry: Entry): string[] {
  return [entry.photo_path, entry.thumb_path].filter((p): p is string => p !== null)
}

/**
 * The write path (spec §12): patch the cache, enqueue the op, kick a flush. Writes never
 * fail at call time — delivery is the outbox's job, and failures surface as row state.
 */
export function useEntryOps(groupId: string, profileId: string) {
  const client = useQueryClient()
  return useMemo(
    () => ({
      insert(input: NewEntry): void {
        void patchAndEnqueue(client, groupId, (l) => upsertEntry(l, optimisticRow(input, groupId)), {
          type: 'insert',
          id: input.id,
          groupId,
          profileId,
          row: toRow(input, groupId),
          ...(input.photo ? { photo: input.photo } : {}),
        })
      },
      update(entry: Entry, patch: EntryPatch, photo?: OpPhoto): void {
        const removePaths = patch.photo_path === null ? storagePaths(entry) : []
        void patchAndEnqueue(
          client,
          groupId,
          (l) => {
            const row = l.find((e) => e.id === entry.id)
            if (!row) return [...l]
            return upsertEntry(l, {
              ...row,
              ...patch,
              drank_on: patch.drank_at ? dayKey(new Date(patch.drank_at)) : row.drank_on,
              updated_at: '',
            })
          },
          { type: 'update', id: entry.id, groupId, profileId, patch, removePaths, ...(photo ? { photo } : {}) },
        )
      },
      remove(entry: Entry): void {
        void patchAndEnqueue(client, groupId, (l) => removeEntry(l, entry.id), {
          type: 'delete',
          id: entry.id,
          groupId,
          profileId,
          patch: { deleted_at: new Date().toISOString() },
          removePaths: storagePaths(entry),
        })
      },
      retry(entryId: string): void {
        void outboxStore.retry(entryId).then(() => flushOutbox(client))
      },
    }),
    [client, groupId, profileId],
  )
}

export type EntryOps = ReturnType<typeof useEntryOps>
```

Delete `insertEntry` from `src/features/entries/api.ts` (its only caller was the old hook).

Run: `npx vitest run src/features/entries/mutations.test.tsx` — PASS. (`src/screens` fails to compile until the next steps — that's expected mid-task; finish before the full run.)

- [ ] **Step 3: Rewrite submit.ts**

Replace `src/screens/registrar/submit.ts` entirely:

```ts
import type { Entry } from '@/features/entries/cache'
import type { EntryOps, EntryPatch, NewEntry } from '@/features/entries/mutations'
import type { OpPhoto } from '@/features/entries/outbox'
import { totalMl } from '@/lib/composition'
import { draftItems, type Draft } from './draft'

/**
 * Submitting is now a pure local enqueue — uploads and retries live in the outbox
 * flusher — so the sheet closes instantly whatever the connectivity (spec §5.2/§12).
 */
export function submitDraft(
  ops: Pick<EntryOps, 'insert' | 'update'>,
  userId: string,
  draft: Draft,
  entry: Entry | undefined,
): void {
  const items = draftItems(draft)
  const note = draft.note.trim() || null
  const photo: OpPhoto | undefined = draft.photo
    ? { photo: draft.photo.blob, thumb: draft.photo.thumb }
    : undefined

  if (entry) {
    const patch: EntryPatch = {
      total_ml: totalMl(items),
      composition: items as Entry['composition'],
      note,
      drank_at: draft.drankAt.toISOString(),
      ...(draft.photoRemoved ? { photo_path: null, thumb_path: null } : {}),
    }
    ops.update(entry, patch, photo)
    return
  }

  ops.insert({
    id: crypto.randomUUID(),
    profileId: userId,
    totalMl: totalMl(items),
    composition: items,
    note,
    drankAt: draft.drankAt,
    photo: photo ?? null,
  })
}
```

- [ ] **Step 4: Rewrite submit.test.ts**

Replace `src/screens/registrar/submit.test.ts` entirely:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Entry } from '@/features/entries/cache'
import { emptyDraft, type Draft } from './draft'
import { submitDraft } from './submit'

const ops = { insert: vi.fn(), update: vi.fn() }

const entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  photo_path: 'g1/u1/e1.jpg',
  thumb_path: 'g1/u1/e1_thumb.jpg',
  drank_at: '2026-09-01T11:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T11:00:00+00:00',
  updated_at: '2026-09-01T11:00:00+00:00',
  deleted_at: null,
} as Entry

function draft(overrides: Partial<Draft>): Draft {
  return { ...emptyDraft(new Date('2026-09-06T12:00:00Z')), loose: 300, ...overrides }
}

describe('submitDraft', () => {
  beforeEach(() => {
    ops.insert.mockReset()
    ops.update.mockReset()
  })

  it('inserts a new entry with a generated id and no photo', () => {
    submitDraft(ops, 'u1', draft({}), undefined)
    expect(ops.insert).toHaveBeenCalledTimes(1)
    const input = ops.insert.mock.calls[0]?.[0]
    expect(input.id).toMatch(/[0-9a-f-]{36}/)
    expect(input).toMatchObject({ profileId: 'u1', totalMl: 300, note: null, photo: null })
  })

  it('carries the photo blobs on the insert', () => {
    const blob = new Blob(['p'])
    const thumb = new Blob(['t'])
    submitDraft(ops, 'u1', draft({ photo: { blob, thumb, previewUrl: 'blob:x' } }), undefined)
    expect(ops.insert.mock.calls[0]?.[0].photo).toEqual({ photo: blob, thumb })
  })

  it('updates an existing entry with the recomputed patch', () => {
    submitDraft(ops, 'u1', draft({ note: ' oi ' }), entry)
    expect(ops.update).toHaveBeenCalledTimes(1)
    const [target, patch, photo] = ops.update.mock.calls[0]!
    expect(target).toBe(entry)
    expect(patch).toMatchObject({ total_ml: 300, note: 'oi' })
    expect('photo_path' in patch).toBe(false)
    expect(photo).toBeUndefined()
  })

  it('photoRemoved nulls the paths in the patch', () => {
    submitDraft(ops, 'u1', draft({ photoRemoved: true }), entry)
    const patch = ops.update.mock.calls[0]?.[1]
    expect(patch.photo_path).toBeNull()
    expect(patch.thumb_path).toBeNull()
  })

  it('a replacement photo travels as the third argument', () => {
    const blob = new Blob(['p'])
    const thumb = new Blob(['t'])
    submitDraft(ops, 'u1', draft({ photo: { blob, thumb, previewUrl: 'blob:x' } }), entry)
    expect(ops.update.mock.calls[0]?.[2]).toEqual({ photo: blob, thumb })
  })
})
```

Run: `npx vitest run src/screens/registrar/submit.test.ts` — PASS.

- [ ] **Step 5: Rewire RegisterSheet**

In `src/screens/registrar/RegisterSheet.tsx`:
- Replace the imports of `useInsertEntry, useUpdateEntry` with `import { useEntryOps } from '@/features/entries/mutations'`. Remove the now-unused `useToast` import and the `toast`/`onFailure` lines (OptionalChips keeps its own toast for unusable images).
- Replace the hook setup:

```tsx
const ops = useEntryOps(groupId, userId ?? '')
```

- Replace the `submit()` body's `submitDraft(...)` call with:

```tsx
submitDraft(ops, userId, draft, entry)
```

(the guard above it already ensures `userId` and `groupId` are set).

In `src/screens/registrar/RegisterSheet.test.tsx`:
- Replace the mutations mock:

```tsx
vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: insertMutate, update: updateMutate, remove: vi.fn(), retry: vi.fn() }),
}))
```

- Delete the `@/features/entries/photos` mock (nothing in the sheet's module graph touches it anymore).
- The insert assertions keep working (`insertMutate.mock.calls[0]?.[0]` is still the `NewEntry`). Update the two update-shape assertions:
  - "edit mode prefills and submits an update": replace the `call.id` / `call.patch.total_ml` lines with

```tsx
const [target, patch] = updateMutate.mock.calls[0]!
expect(target.id).toBe('e1')
expect(patch.total_ml).toBe(1800)
```

  - "removing an existing photo…": replace the `call.patch.*` lines with

```tsx
const patch = updateMutate.mock.calls[0]?.[1]
expect(patch.photo_path).toBeNull()
expect(patch.thumb_path).toBeNull()
```

- [ ] **Step 6: Rewire RegistersCard and Hoje.test**

In `src/screens/hoje/RegistersCard.tsx`:
- Replace the `useUpdateEntry`/`removeEntryPhotos`/`useToast` imports and setup with:

```tsx
import { useEntryOps } from '@/features/entries/mutations'
```

```tsx
const ops = useEntryOps(groupId, userId)
```

- Replace the `onDelete` handler with:

```tsx
onDelete={() => ops.remove(entry)}
```

(the flusher now removes the storage objects after the soft delete lands — spec §13 step 7 ordering preserved).

In `src/screens/hoje/Hoje.test.tsx`, replace the mutations mock:

```tsx
vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: vi.fn(), update: vi.fn(), remove: vi.fn(), retry: vi.fn() }),
}))
```

Delete `falhou: 'Não foi possível salvar. Tente de novo.',` from `src/lib/strings.ts` (its callers are gone).

Run: `npm run test:run && npm run typecheck` — all green.

- [ ] **Step 7: Update the spec for the two deviations**

In `docs/superpowers/specs/2026-08-11-gymfishes-design.md`:

§5.1, replace the outbox bullet with:

```
- A register still in the outbox shows a small dot next to the time. It stays editable —
  edits and deletes while it waits merge into the queued operation (§12). If sending has
  definitively failed, the row shows "Falha ao enviar — tentar novamente".
```

§12, in the **Reads** list, replace items 1 and 4 with:

```
1. Derive `lastSyncAt` as the newest server `updated_at` present in the local mirror
   (optimistic rows carry an empty `updated_at` and are excluded, so client clocks never
   pollute the watermark).
4. Nothing extra is stored: because the watermark is derived from the mirror itself, a
   crash between fetch and persist can never leave it ahead of the data.
```

§12, replace the `OutboxOp` code block with:

```ts
type OutboxOp =
  | { type: 'insert'; id: string; groupId; profileId; row; photo?: { photo: Blob; thumb: Blob }
      createdAt: number; attempts: number; rev: number }
  | { type: 'update'; id; groupId; profileId; patch; photo?; removePaths: string[]; …meta }
  | { type: 'delete'; id; groupId; profileId; patch; removePaths: string[]; …meta }
// 'delete' is sent as an update setting deleted_at; removePaths are cleaned up after it lands.
// rev bumps on every merge, so a send racing an edit can never drop the newer version.
```

§12, replace the retry bullet ("Retry with exponential backoff…") with:

```
- Server rejections retry with exponential backoff, capped at 5 attempts and 60 seconds.
  After 5 failures the op is marked failed and surfaced in Hoje as "Falha ao enviar —
  tentar novamente", with a manual retry. Network and auth errors never count as attempts —
  offline is a wait, not a failure — and retry on the next flush trigger (or every 30 s
  while the browser still claims to be online). Nothing is ever silently dropped.
```

§12, extend the merge bullet ("Ordering is FIFO…") with one sentence:

```
  A delete for an entry still queued as an insert simply drops the op — the entry never
  reached the server. Merging resets the attempt count.
```

- [ ] **Step 8: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.
Run: `npm run dev` and smoke by hand: register, edit, delete — all still land in Supabase (check Hoje after a reload).

```bash
git add src/features/entries src/screens/registrar src/screens/hoje src/lib/strings.ts docs/superpowers/specs/2026-08-11-gymfishes-design.md
git commit -m "feat: route entry writes through the outbox"
```

---

### Task 7: Row UI — pending dot, failed state with manual retry

**Files:**
- Modify: `src/lib/strings.ts`, `src/screens/hoje/EntryRow.tsx`, `src/screens/hoje/EntryRow.test.tsx`, `src/screens/hoje/RegistersCard.tsx`, `src/screens/hoje/Hoje.test.tsx`

**Interfaces:**
- Consumes: `useOutboxStatus` (Task 3), `ops.retry` (Task 6).
- Produces: `EntryRow` props gain `pending: boolean; failed: boolean; onRetry: () => void`. Strings `STRINGS.sync.pendente`, `STRINGS.sync.falhaTentarNovamente`.

- [ ] **Step 1: Strings**

Add to `src/lib/strings.ts`, as a new top-level section:

```ts
  sync: {
    pendente: 'Aguardando envio',
    falhaTentarNovamente: 'Falha ao enviar — tentar novamente',
  },
```

- [ ] **Step 2: Write the failing tests**

In `src/screens/hoje/EntryRow.test.tsx`, add a local render helper below the `entry` fixture, then rewrite the existing tests' `renderWithProviders(<EntryRow …/>)` calls to use it (each existing test passes its previous props as overrides — e.g. the partner test becomes `renderRow({ authorName: 'Ana', isOwn: false })`):

```tsx
function renderRow(overrides: Partial<Parameters<typeof EntryRow>[0]> = {}) {
  return renderWithProviders(
    <EntryRow
      entry={entry}
      authorName="Leo"
      isOwn
      pending={false}
      failed={false}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onRetry={vi.fn()}
      {...overrides}
    />,
  )
}
```

Then add the new tests:

```tsx
it('shows the pending dot while the entry waits in the outbox', () => {
  renderRow({ pending: true })
  expect(screen.getByRole('img', { name: 'Aguardando envio' })).toBeInTheDocument()
})

it('a failed entry shows the retry line and taps call onRetry', async () => {
  const onRetry = vi.fn()
  renderRow({ failed: true, onRetry })
  await userEvent.click(
    screen.getByRole('button', { name: 'Falha ao enviar — tentar novamente' }),
  )
  expect(onRetry).toHaveBeenCalled()
})

it('a pending own entry still offers Editar when expanded', async () => {
  // deviation settled in this plan: pending entries stay editable; edits merge into the queued op
  renderRow({ pending: true })
  await userEvent.click(screen.getByText(/Leo · 11:00/))
  expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
})
```

Run: `npx vitest run src/screens/hoje/EntryRow.test.tsx` — FAIL.

- [ ] **Step 3: Implement in EntryRow**

Add the three props to `Props` and the destructuring:

```tsx
type Props = {
  entry: Entry
  authorName: string
  isOwn: boolean
  pending: boolean
  failed: boolean
  onEdit: () => void
  onDelete: () => void
  onRetry: () => void
}
```

Next to the time (inside the name·time `<span>`), after the `formatTime(...)` text:

```tsx
{pending || failed ? (
  <span
    role="img"
    aria-label={STRINGS.sync.pendente}
    className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-3 align-middle"
  />
) : null}
```

After the main row `<button>` (still inside the `<li>`, before the expanded block):

```tsx
{failed ? (
  <button
    type="button"
    onClick={onRetry}
    className="min-h-[44px] w-full pl-[54px] text-left text-[13px] font-bold text-danger"
  >
    {STRINGS.sync.falhaTentarNovamente}
  </button>
) : null}
```

- [ ] **Step 4: Wire RegistersCard**

In `src/screens/hoje/RegistersCard.tsx`:

```tsx
import { useOutboxStatus } from '@/features/entries/outboxStore'
```

```tsx
const status = useOutboxStatus()
```

And on each `<EntryRow>`:

```tsx
pending={status.pending.has(entry.id)}
failed={status.failed.has(entry.id)}
onRetry={() => ops.retry(entry.id)}
```

In `src/screens/hoje/Hoje.test.tsx`, add alongside the other mocks:

```tsx
vi.mock('@/features/entries/outboxStore', () => ({
  useOutboxStatus: () => ({ pending: new Set(), failed: new Set(), queued: new Set() }),
}))
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/screens/hoje` — PASS.
Run: `npm run test:run && npm run typecheck` — all green.
Run: `npm run dev`, open DevTools → Network → Offline, register some water: the row appears instantly with the dot; go back online, tap into another tab and back (or wait): the dot clears.

```bash
git add src/lib/strings.ts src/screens/hoje
git commit -m "feat: pending dot and failed-retry state on entry rows"
```

---

### Task 8: Header pills — "Sem conexão" and "Dados desatualizados"

**Files:**
- Modify: `src/lib/strings.ts`, `src/features/entries/queries.ts`, `src/features/entries/queries.test.tsx`, `src/screens/hoje/Hoje.tsx`, `src/screens/hoje/Hoje.test.tsx`
- Create: `src/screens/hoje/SyncPill.tsx`, `src/screens/hoje/SyncPill.test.tsx`

**Interfaces:**
- Consumes: `useEntries` `dataUpdatedAt`, `onlineManager` from `@tanstack/react-query`, `STRINGS.erro.semConexao` (exists).
- Produces:
  - `syncStatusOf(online: boolean, dataUpdatedAt: number, now: number): { offline: boolean; stale: boolean }` — pure, exported from `queries.ts`
  - `useSyncStatus(groupId: string | null | undefined)` — same shape, live
  - `<SyncPill groupId={…} />` rendered in the Hoje header; `STRINGS.sync.desatualizado`

- [ ] **Step 1: String**

Add to the `sync` section of `src/lib/strings.ts`:

```ts
    desatualizado: 'Dados desatualizados',
```

- [ ] **Step 2: Write the failing tests**

Append to `src/features/entries/queries.test.tsx`:

```tsx
import { syncStatusOf } from './queries'

describe('syncStatusOf', () => {
  const cincoMin = 5 * 60_000
  it('offline wins and suppresses stale', () => {
    expect(syncStatusOf(false, 1000, 1000 + cincoMin + 1)).toEqual({ offline: true, stale: false })
  })
  it('stale after 5 minutes without a successful sync, but only once data existed', () => {
    expect(syncStatusOf(true, 1000, 1000 + cincoMin + 1)).toEqual({ offline: false, stale: true })
    expect(syncStatusOf(true, 1000, 1000 + cincoMin)).toEqual({ offline: false, stale: false })
    expect(syncStatusOf(true, 0, cincoMin * 10)).toEqual({ offline: false, stale: false })
  })
})
```

Create `src/screens/hoje/SyncPill.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncPill } from './SyncPill'

const status = vi.hoisted(() => ({ offline: false, stale: false }))
vi.mock('@/features/entries/queries', () => ({
  useSyncStatus: () => ({ ...status }),
}))

describe('SyncPill', () => {
  it('renders nothing when online and fresh', () => {
    status.offline = false
    status.stale = false
    const { container } = render(<SyncPill groupId="g1" />)
    expect(container).toBeEmptyDOMElement()
  })
  it('shows Sem conexão when offline', () => {
    status.offline = true
    status.stale = false
    render(<SyncPill groupId="g1" />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
  })
  it('shows Dados desatualizados when stale', () => {
    status.offline = false
    status.stale = true
    render(<SyncPill groupId="g1" />)
    expect(screen.getByText('Dados desatualizados')).toBeInTheDocument()
  })
})
```

Run: `npx vitest run src/features/entries/queries.test.tsx src/screens/hoje/SyncPill.test.tsx` — FAIL.

- [ ] **Step 3: Implement the hook and the pill**

Append to `src/features/entries/queries.ts`:

```ts
const STALE_MS = 5 * 60_000

/** Pure core of the header pills: offline beats stale; stale = 5 min without a successful sync (spec §14). */
export function syncStatusOf(
  online: boolean,
  dataUpdatedAt: number,
  now: number,
): { offline: boolean; stale: boolean } {
  return {
    offline: !online,
    stale: online && dataUpdatedAt > 0 && now - dataUpdatedAt > STALE_MS,
  }
}

export function useSyncStatus(groupId: string | null | undefined): { offline: boolean; stale: boolean } {
  const online = useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  )
  const { dataUpdatedAt } = useEntries(groupId)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return syncStatusOf(online, dataUpdatedAt, now)
}
```

with the extra imports at the top:

```ts
import { useEffect, useState, useSyncExternalStore } from 'react'
import { onlineManager, useQuery, useQueryClient } from '@tanstack/react-query'
```

Create `src/screens/hoje/SyncPill.tsx`:

```tsx
import { useSyncStatus } from '@/features/entries/queries'
import { STRINGS } from '@/lib/strings'

/** Yellow = attention without alarm; red stays reserved for delete (spec §8). */
export function SyncPill({ groupId }: { groupId: string | null | undefined }) {
  const { offline, stale } = useSyncStatus(groupId)
  if (!offline && !stale) return null
  return (
    <span className="mt-1 inline-block rounded-[99px] border border-streak px-3 py-1 text-[11px] font-bold text-streak">
      {offline ? STRINGS.erro.semConexao : STRINGS.sync.desatualizado}
    </span>
  )
}
```

Run: `npx vitest run src/features/entries/queries.test.tsx src/screens/hoje/SyncPill.test.tsx` — PASS.

- [ ] **Step 4: Mount in the Hoje header**

In `src/screens/hoje/Hoje.tsx`, inside the header's left `<div>`, after the date `<p>`:

```tsx
<SyncPill groupId={groupId} />
```

with `import { SyncPill } from './SyncPill'`.

In `src/screens/hoje/Hoje.test.tsx`, extend the existing `@/features/entries/queries` mock with:

```tsx
  useSyncStatus: () => ({ offline: false, stale: false }),
```

- [ ] **Step 5: Verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.
Run: `npm run dev`, DevTools → Network → Offline: the yellow "Sem conexão" pill appears in the Hoje header; back online it disappears.

```bash
git add src/lib/strings.ts src/features/entries/queries.ts src/features/entries/queries.test.tsx src/screens/hoje
git commit -m "feat: sem-conexao and stale-data pills in Hoje"
```

---

### Task 9: Wiring, integration test, docs

**Files:**
- Modify: `src/app/AppShell.tsx` (and `src/app/AppShell.test.tsx` only if it breaks), `docs/superpowers/plans/ROADMAP.md`
- Create: `src/features/entries/offline.test.ts`

**Interfaces:**
- Consumes: `useOutboxFlush` (Task 4), `createOutboxStore` (Task 3), `flushOutbox(client, store)` (Task 4).

- [ ] **Step 1: Mount the flush triggers**

In `src/app/AppShell.tsx`:

```tsx
import { useOutboxFlush } from '@/features/entries/flush'
```

and inside `AppShell`, right after `useRealtimeEntries(...)`:

```tsx
useOutboxFlush()
```

AppShell mounts inside `Guard`, so the Supabase session is restored before the first flush — an expired-session queue survives logout and flushes after re-auth (spec §14).

Run: `npx vitest run src/app/AppShell.test.tsx` — if it fails on the new hook, add `vi.mock('@/features/entries/flush', () => ({ useOutboxFlush: () => {} }))` next to its existing mocks.

- [ ] **Step 2: Write the integration test — the milestone's "done when", simulated**

`src/features/entries/offline.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager, QueryClient } from '@tanstack/react-query'
import type { TablesInsert } from '@/lib/database.types'
import type { NewOp, OutboxOp } from './outbox'
import { createOutboxStore } from './outboxStore'
import { flushOutbox } from './flush'

const api = vi.hoisted(() => ({
  upsertEntryRow: vi.fn(),
  updateEntry: vi.fn(),
  fetchEntriesSince: vi.fn(),
}))
vi.mock('./api', () => api)
vi.mock('./photos', () => ({ uploadEntryPhoto: vi.fn(), removeEntryPhotos: vi.fn() }))

const row: TablesInsert<'entries'> = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 500,
  composition: [],
  note: null,
  drank_at: '2026-09-06T12:00:00.000Z',
}

const op: NewOp = { type: 'insert', id: 'e1', groupId: 'g1', profileId: 'u1', row }

describe('offline register → force-quit → reopen → sync (success criterion 3)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    api.upsertEntryRow.mockReset().mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('the op persists across a restart and flushes on next open', async () => {
    // shared "disk"
    let stored: OutboxOp[] | undefined
    const io = {
      load: () => Promise.resolve(stored),
      save: (q: OutboxOp[]) => {
        stored = q
        return Promise.resolve()
      },
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // session 1: airplane mode — register, flush does nothing, app "force-quits"
    onlineManager.setOnline(false)
    const session1 = createOutboxStore(io)
    await session1.enqueue(op)
    await flushOutbox(client, session1)
    expect(api.upsertEntryRow).not.toHaveBeenCalled()
    expect(stored).toHaveLength(1)

    // session 2: fresh store over the same disk, back online — flush on app start
    onlineManager.setOnline(true)
    const session2 = createOutboxStore(io)
    await flushOutbox(client, session2)
    expect(api.upsertEntryRow).toHaveBeenCalledWith(row)
    expect(stored).toHaveLength(0)
    expect(session2.getStatus().queued.size).toBe(0)
  })
})
```

Run: `npx vitest run src/features/entries/offline.test.ts` — PASS (everything it exercises already exists; if it fails, the bug is real — fix it, don't bend the test).

- [ ] **Step 3: Update the roadmap**

In `docs/superpowers/plans/ROADMAP.md`, update the M3 row:

```
| M3 | Offline e sync | [`2026-09-06-m3-offline-sync.md`](2026-09-06-m3-offline-sync.md) | **code-complete** — pending owner verification: airplane-mode register survives a force-quit on a real iPhone |
```

And unblock M4 (`blocked by M3` → `ready`) since M3 is code-complete. Leave M5's status as is (it depends on M2).

- [ ] **Step 4: Full verify and commit**

Run: `npm run test:run && npm run typecheck` — all green.

```bash
git add src/app/AppShell.tsx src/app/AppShell.test.tsx src/features/entries/offline.test.ts docs/superpowers/plans/ROADMAP.md
git commit -m "feat: flush outbox on start, focus and reconnect"
```

---

## Owner verifications (manual, after code-complete)

The milestone's "done when" can only truly be verified on a device:

1. **Airplane-mode register survives a force-quit** — on the installed PWA: enable airplane mode, register 500 ml (row appears with the dot, "Sem conexão" pill shows), force-quit the app, disable airplane mode, reopen: the register syncs (dot clears) and appears on the other phone.
2. **Offline edit merges** — while in airplane mode, register then edit the same entry; back online, exactly one row exists in Supabase with the edited value.
3. **Stale pill** — leave the app open with the network blocked at the router (not airplane mode) for 5+ minutes: "Dados desatualizados" appears.

## Notes for the reviewer

- **Accepted edge:** a failed op whose author never taps retry keeps its optimistic row in the persisted mirror indefinitely — visible, loudly marked, never silently dropped (spec §14). Retry converges it.
- **Accepted edge:** if a different account logs in on the same device with ops still queued, RLS rejects them into the failed state. Two-person household; not worth machinery.
- **Realtime echo of your own write** can arrive while a *second* edit of the same entry is queued; the guard in `realtime.ts` skips it and the post-flush sync reconciles.
- **Why no `AbortSignal` timeouts on sends:** fetch has OS-level timeouts; a hung request delays the queue at worst until the next app open. Not worth the plumbing.
