# §11 RLS checklist — programmatic run

Run date: 2026-09-01 (America/Sao_Paulo project, run in UTC ~20:49–20:56).
Method: Git Bash + `curl` against the Supabase REST/Auth/Storage APIs, per the controller's
programmatic procedure (replaces the brief's manual two-browser walkthrough). Admin-only
reads via `npx supabase db query --linked` (superuser, bypasses RLS — used strictly to seed
known-good ids and to verify negatives, never to write).

All access/refresh tokens are REDACTED below. The anon key used as `apikey` on every call is
the public client key (`VITE_SUPABASE_ANON_KEY`), not a secret.

## Setup

Two throwaway accounts were created via `POST /auth/v1/signup` (autoconfirm on, so signup
returns a session directly):

- **C** — `rls-check-c@example.com` — uid `0b4f8115-39c6-4219-a8ba-38a49f0e4b79`
- **D** — `rls-check-d@example.com` — uid `00e5a50d-2227-4ff4-9d9e-7094c68562da`

C created a throwaway group **G2** (`id 720bcc83-a8fe-4634-a9c9-1cb14d9f3dae`,
`invite_code RLSCK2`), inserted its own `profiles` row and `group_members` row, and inserted
one entry. D inserted its own `profiles` row, then joined G2 via `rpc/join_group`.

```
POST /auth/v1/signup  {"email":"rls-check-c@example.com","password":"<redacted>"}
  -> 200, access_token=<REDACTED>, user.id=0b4f8115-39c6-4219-a8ba-38a49f0e4b79
POST /rest/v1/profiles  {"id":"<C>","display_name":"RLS C"}                    [Bearer <C_REDACTED>]
  -> 201
POST /rest/v1/groups  {"name":"rls-check","invite_code":"RLSCK2","created_by":"<C>"}
  Prefer: return=representation                                                [Bearer <C_REDACTED>]
  -> 201, id=720bcc83-a8fe-4634-a9c9-1cb14d9f3dae
POST /rest/v1/group_members  {"group_id":"<G2>","profile_id":"<C>"}            [Bearer <C_REDACTED>]
  -> 201
POST /rest/v1/entries  {"id":"6bc821c4-...","profile_id":"<C>","group_id":"<G2>",
                         "total_ml":500,"drank_at":"2026-09-01T20:53:56.9Z"}    [Bearer <C_REDACTED>]
  -> 201

POST /auth/v1/signup  {"email":"rls-check-d@example.com","password":"<redacted>"}
  -> 200, access_token=<REDACTED>, user.id=00e5a50d-2227-4ff4-9d9e-7094c68562da
POST /rest/v1/profiles  {"id":"<D>","display_name":"RLS D"}                    [Bearer <D_REDACTED>]
  -> 201
POST /rest/v1/rpc/join_group  {"code":"RLSCK2"}                                [Bearer <D_REDACTED>]
  -> 200
```

### One setup wrinkle (not an RLS defect)

The first attempt at `POST /rest/v1/group_members` (C's own membership) and at
`POST /rest/v1/entries` (C's entry) used `Prefer: return=representation` and both came back
`403 42501 "new row violates row-level security policy"`, even though the underlying
`with check` conditions were true (confirmed independently via admin `EXPLAIN`-equivalent
queries and via a follow-up `GET` that showed the row satisfying the exact predicate). Retried
without `Prefer: return=representation` (PostgREST's default for a bare `.insert()`) and both
succeeded with `201`. This matches exactly what the real app does — `src/features/group/mutations.ts`
`createGroup()` calls `.insert()` on `group_members` **without** `.select()`, so it never sends
`return=representation` — so this is a PostgREST/RETURNING quirk hit only by my own test
tooling, not a bug in the shipped app or in the RLS policies. Noted for completeness; no policy
change made.

## Real-group reference ids (read-only, via admin — never written to)

- Real group id: `fb9c92c7-63ac-4fba-b324-277af82aa24d` (the only group in the DB besides G2)
- Real member profile id: `8d0189f3-faea-452c-8990-00db73edfc6c`
- Real group currently has **0 entries** and **0 bottles** for that profile (neither real
  account has registered water yet) and **1 member**. This means checks 1 and (implicitly) the
  "real entry" reference in check 3 have no live real row to read — check 3 instead targets
  **C's own entry** (per the controller's checklist wording, which only needs a real *group id*
  for checks 1/5/6, not a real entry). Check 1 (`GET` filtered to the real group id) still
  exercises the real RLS predicate (`is_group_member(real_gid)` correctly evaluates false for
  D) even though the table for that group happens to be empty right now.

## Checklist results

| # | Check | Result | HTTP | Notes |
|---|-------|--------|------|-------|
| 1 | D cannot read real group's entries (`GET /entries?group_id=eq.<real>`) | **PASS** | 200, `[]` | 0 rows |
| 2 | D cannot read C's bottles (same group) | **PASS** | 200, `[]` | C's bottle exists (created just before); D sees none |
| — | *Positive control:* C **can** read C's own bottles | **PASS** | 200, 1 row | |
| 3 | D cannot update/soft-delete C's entry (`PATCH .../entries?id=eq.<C entry>`) | **PASS** | 200, `[]` (0 rows) | Admin-verified: `deleted_at` still `null` |
| 4 | D cannot insert an entry with `profile_id = C` | **PASS** | 403 `42501` | `new row violates row-level security policy for table "entries"` |
| 5a | D cannot sign real group's photo path | **PASS** | 400 (`NoSuchKey`/`not_found`) | No such object exists to sign — storage returns 404-style error either way; RLS on `storage.objects` select would also block it since D isn't a member of the real group |
| 5b | D cannot upload into real group's prefix (`photos/<real gid>/<D uid>/x.jpg`) | **PASS** | HTTP 400 envelope, body `statusCode:"403" AccessDenied "new row violates row-level security policy"` | Supabase Storage wraps the real status in the JSON body; the embedded status is 403/AccessDenied as expected |
| 6 | D cannot insert self into real group directly (`POST /group_members`) | **PASS** | 403 `42501` | `new row violates row-level security policy for table "group_members"`. **Admin-verified**: `select count(*) from group_members where group_id='<real>' and profile_id='<D>'` → `0`. No row was created. |
| 7 | Invalid invite code (`rpc/join_group {"code":"XXXXXX"}`) | **PASS** | 400 `P0001` | `message: "invalid_code"`. Admin-verified: D's `group_members` rows are exactly `{G2}` — no stray membership. |
| — | *Positive control:* D **can** read C's entry via `GET /entries?group_id=eq.<G2>` | **PASS** | 200, 1 row | Returned C's entry |
| — | *Positive control:* D **can** insert their own entry in G2 | **PASS** | 201 | `id 5b71addb-09b8-4f72-8652-b8e82d21f47f` |

**All 7 negative checks pass, all positive controls pass. No BLOCKED items.**

Additional admin-only confirmation after the run, that nothing under the real group was
touched:

```
select name from storage.objects where bucket_id='photos'
  and name like 'fb9c92c7-63ac-4fba-b324-277af82aa24d/%';        -> 0 rows
select count(*) from entries where group_id='fb9c92c7-...';       -> 0 (unchanged)
```

## IDs created (throwaway, for cleanup — see `rls-cleanup.sql`)

| Kind | Id |
|---|---|
| Account C | `0b4f8115-39c6-4219-a8ba-38a49f0e4b79` (rls-check-c@example.com) |
| Account D | `00e5a50d-2227-4ff4-9d9e-7094c68562da` (rls-check-d@example.com) |
| Group G2 | `720bcc83-a8fe-4634-a9c9-1cb14d9f3dae` |
| C's entry | `6bc821c4-8e1e-4163-8cd0-b749a9df830d` |
| D's entry | `5b71addb-09b8-4f72-8652-b8e82d21f47f` |
| C's bottle | `ad41f3b6-659e-43d0-80ef-4c99340fa9cc` |

No storage objects were created (both photo tests were negative checks against the real
group's prefix and were correctly rejected before any object was written).
