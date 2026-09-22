# §11 RLS checklist — programmatic re-run against the live (populated) project

Run date: 2026-09-22 (America/Sao_Paulo project, run in UTC ~05:14–05:22). This repeats the
2026-09-01 run (`docs/superpowers/2026-09-01-rls-checklist-evidence.md`), now that the real group
has accumulated entries, bottles and photo objects from real usage — so the checks exercise RLS
against a populated project instead of an empty one.

Method: Git Bash + `curl` against the Supabase REST/Auth/Storage APIs, following the September
run's request shapes exactly. Admin-only reads via `npx supabase db query --linked` (superuser,
bypasses RLS — used strictly to cross-check negatives and confirm nothing was written under the
real group, never to write). The permission prompt for `db query --linked` was **granted** this
run (unlike a denial that would have required verifying negatives through the accounts' own reads
only) — four read-only admin queries were run in total, all reported below.

All access/refresh tokens and the storage signed-URL tokens are REDACTED below. The anon key used
as `apikey` on every call is the public client key (`VITE_SUPABASE_ANON_KEY`), not a secret, but is
redacted too per instructions.

## Setup

Account **E** is the permanent e2e account from Task 5 (`gymfishes-e2e@example.com`), alone in its
own throwaway group "E2E". Account **F** is a fresh throwaway created for this task via the sign-up
endpoint. Both live in E's group; the negative checks target the **real group id** recorded in the
September document (`fb9c92c7-63ac-4fba-b324-277af82aa24d`), never writing to it.

```
POST /auth/v1/token?grant_type=password  {"email":"gymfishes-e2e@example.com","password":"<REDACTED>"}
  -> 200, access_token=<REDACTED>, user.id=7057c2a3-455e-49b7-bdee-dd203a747553   (E)

GET /rest/v1/group_members?profile_id=eq.<E>&select=group_id                     [Bearer <E_REDACTED>]
  -> 200, [{"group_id":"fac9ffe0-9a80-4515-8d38-e3f7647db914"}]

GET /rest/v1/groups?id=eq.<E group>&select=id,name,invite_code,created_by        [Bearer <E_REDACTED>]
  -> 200, [{"id":"fac9ffe0-...","name":"E2E","invite_code":"F86WWZ","created_by":"<E>"}]

POST /auth/v1/signup  {"email":"gymfishes-rls-f@example.com","password":"<redacted>"}
  -> 200, access_token=<REDACTED>, user.id=57b27d53-8d92-460f-a713-1b74061acb65   (F)

POST /rest/v1/profiles  {"id":"<F>","display_name":"RLS F"}                      [Bearer <F_REDACTED>]
  -> 201

POST /rest/v1/rpc/join_group  {"code":"F86WWZ"}                                  [Bearer <F_REDACTED>]
  -> 200, "fac9ffe0-9a80-4515-8d38-e3f7647db914"

GET /rest/v1/group_members?profile_id=eq.<F>&select=group_id                     [Bearer <F_REDACTED>]
  -> 200, [{"group_id":"fac9ffe0-9a80-4515-8d38-e3f7647db914"}]     (confirms F joined only E's group)
```

Seed rows (positive controls), all in E's throwaway group, none under the real group:

```
POST /rest/v1/bottles  {"profile_id":"<E>","name":"RLS bottle","volume_ml":500}   [Bearer <E_REDACTED>]
  -> 201  (read back: id 6828c02d-62c8-4ddf-8564-f7e72941ac54)

POST /rest/v1/entries  {"id":"5805efdd-...","profile_id":"<E>","group_id":"<E group>",
                         "total_ml":500,"drank_at":"<now>",
                         "photo_path":"photos/<E group>/<E>/rls.jpg"}             [Bearer <E_REDACTED>]
  -> 201

printf 'rls' > rls.jpg
POST /storage/v1/object/photos/<E group>/<E>/rls.jpg   (Content-Type: image/jpeg) [Bearer <E_REDACTED>]
  -> 200, {"Key":"photos/<E group>/<E>/rls.jpg","Id":"c72b7f66-cd22-4e18-a34f-79206be22f6d"}

POST /rest/v1/entries  {"id":"5b9f2571-...","profile_id":"<F>","group_id":"<E group>",
                         "total_ml":300,"drank_at":"<now>"}                       [Bearer <F_REDACTED>]
  -> 201   (300 ml, not 500, so it cannot be confused with the smoke test's rows)
```

### Note: pre-existing soft-deleted rows in E's group

A `GET /entries?group_id=eq.<E group>` at this point returned 9 rows, not 2: seven were
`total_ml:500`, `deleted_at` already set, left over from Task 5's Playwright smoke-test failed
runs (soft-deleted then, per that task's own cleanup — see `task-5-report.md`, "Account cleanup").
This is expected residue, not something this task created or needed to touch; RLS's soft-delete
model means `deleted_at` rows stay in the table. Only the two new rows (E's `5805efdd-...` and F's
`5b9f2571-...`) are this run's seed data.

## Real-group reference id (unchanged from the September run)

- Real group id: `fb9c92c7-63ac-4fba-b324-277af82aa24d`
- Admin-verified (read-only) at the end of this run: **1** member, **2** pre-existing photo
  objects under its storage prefix (real usage, untouched by this run — see admin verification
  below). Unlike September, the real group's `entries`/`bottles` tables are no longer empty (the
  premise of this re-run), but no query against them was needed beyond confirming nothing from
  this run leaked in (see below).

## Checklist results

| # | Check | Result | HTTP | Notes |
|---|-------|--------|------|-------|
| 1 | F cannot read real group's entries (`GET /entries?group_id=eq.<real>`) | **PASS** | 200, `[]` | 0 rows |
| 2 | F cannot read E's bottles (same group) | **PASS** | 200, `[]` | |
| — | *Positive control:* E **can** read its own bottle | **PASS** | 200, 1 row | `RLS bottle`, 500 ml |
| 3 | F cannot update/soft-delete E's entry (`PATCH .../entries?id=eq.<E entry>` `{"deleted_at":"<now>"}`) | **PASS** | 200, `[]` (0 rows, `Prefer: return=representation`) | E's follow-up read: `deleted_at` still `null` |
| 4 | F cannot insert an entry with `profile_id=E` | **PASS** | 403 `42501` | `new row violates row-level security policy for table "entries"` |
| 5a | F cannot list objects under the real group's prefix (`POST /storage/v1/object/list/photos` `{"prefix":"<real gid>/","limit":100}`) | **PASS** | 200, `[]` | |
| 5b | F cannot upload into the real group's prefix (`POST /storage/v1/object/photos/<real gid>/<F>/x.jpg`) | **PASS** | 400 | Body: `{"statusCode":"403","error":"Unauthorized","message":"new row violates row-level security policy","code":"AccessDenied"}` — same wrapped-403 shape as September |
| 5c | *Positive control:* E signs its own photo (`POST /storage/v1/object/sign/photos/<E path>` `{"expiresIn":60}`) | **PASS** | 200 | `signedURL` present (token redacted) |
| 5c | *Positive control:* F, same group, signs the same path | **PASS** | 200 | `signedURL` present (token redacted) |
| 5d | F cannot sign a path under the real prefix | **PASS**\* | 400 | Body: `{"statusCode":"404","error":"not_found","message":"Object not found","code":"NoSuchKey"}` — \*caveated, see note below the table |
| 6 | F cannot insert itself into the real group directly (`POST /group_members`) | **PASS** | 403 `42501` | `new row violates row-level security policy for table "group_members"`. Confirmed via F's own read: `group_members` = `{E's group}` only |
| 7 | Invalid invite code (`rpc/join_group {"code":"XXXXXX"}`) | **PASS** | 400 `P0001` | `message: "invalid_code"`. Confirmed via F's own read, recorded at the time: `GET /rest/v1/group_members?profile_id=eq.<F>&select=group_id` → 200, `[{"group_id":"fac9ffe0-9a80-4515-8d38-e3f7647db914"}]` — the same single row as right after F legitimately joined via the valid code (setup, above); the invalid-code attempt added nothing |
| — | *Positive control:* F **can** read E's entry in the shared group | **PASS** | 200, 9 rows (incl. E's and F's test entries) | |
| — | *Positive control:* F **can** insert its own 300 ml entry | **PASS** | 201 | id `5b9f2571-4434-4f8c-8c0a-3e473a2af8bf` |
| — | *Positive control:* E **can** read both test entries | **PASS** | 200, same 9 rows | |

**All 7 negative checks pass, all positive controls pass. No BLOCKED items.**

### Check 3 nuance

The first `PATCH /rest/v1/entries?id=eq.<E entry>` attempt (as F, no `Prefer` header) returned
`204` with no body — PostgREST's default response shape for an update, which does not by itself
distinguish "0 rows matched" from "N rows matched but the response was suppressed." That 204 was
re-run with `Prefer: return=representation` to get the `200 []` shown in the table, which is
conclusive: an empty array means literally no row was returned to F for updating. Either response
form is conclusive only together with the follow-up read (as E) that shows the entry's
`deleted_at` is still `null` — which the table already records.

### Check 5d caveat

A `400`/`NoSuchKey`/`Object not found` when F tries to sign a path under the real group's prefix
cannot, by itself, distinguish "RLS denied the read" from "no object exists at that literal path" —
Supabase Storage's `sign` endpoint masks both cases behind the same 404-style body (this matches
the September document's note on its analogous check). So 5d does not carry the negative on its
own; it's included for completeness because the brief asks for it ("record what comes back"). The
conclusive negative for reads under the real group's storage prefix is **check 5a**: F's
`POST /storage/v1/object/list/photos` with `{"prefix":"<real gid>/","limit":100}` returns `200 []`,
which is governed directly by RLS on `storage.objects` `select` — a real, populated prefix (the
admin verification below shows 2 real photo objects exist under it) returning empty to F only
because RLS filters them out, not because they don't exist.

No PostgREST quirk was hit this run (unlike September's `Prefer: return=representation` on a bare
insert triggering a false-negative `403`) — every `POST` (insert) in this run was sent **without**
`Prefer: return=representation`, per the app's own `.insert()` calls and per this task's
instructions, and every insert that should succeed did (`201`) on the first attempt. `PATCH`
(update/soft-delete) and the final `DELETE` (leaving the group) used
`Prefer: return=representation` to see the affected-row body, which is not the code path that hit
September's quirk.

## Admin verification (read-only, permission granted this run)

Four `npx supabase db query --linked` calls, all read-only, all after the negative checks above
had already returned their expected denials through the accounts' own reads:

```sql
select count(*) from group_members where group_id='fb9c92c7-63ac-4fba-b324-277af82aa24d';
  -> 1   (unchanged; F never joined)

select (select count(*) from group_members where group_id='fb9c92c7-...') as real_members,
       (select count(*) from storage.objects where bucket_id='photos'
          and name like 'fb9c92c7-.../%') as real_photo_objects;
  -> real_members: 1, real_photo_objects: 2   (pre-existing real usage, untouched by this run)

select count(*) as leaked from entries where group_id='fb9c92c7-...'
  and profile_id in ('<F>','<E>');
  -> 0   (neither F's nor E's ids appear in the real group's entries)

select count(*) as leaked_object from storage.objects where bucket_id='photos'
  and name='fb9c92c7-.../<F>/x.jpg';
  -> 0   (check 5b's rejected upload created nothing)
```

What was **not** admin-verified: nothing — the permission prompt for `db query --linked` was
granted throughout, so every negative in this run has both an account-level read (from F or E's
own session) and, where it added value, an admin cross-check. Per the task's instruction, since
the prompt was never denied, there was no need to fall back to account-reads-only for any check.

## IDs created (throwaway, for reference)

| Kind | Id |
|---|---|
| Account F | `57b27d53-8d92-460f-a713-1b74061acb65` (`gymfishes-rls-f@example.com`) |
| E's test bottle | `6828c02d-62c8-4ddf-8564-f7e72941ac54` |
| E's test entry | `5805efdd-a806-4149-b17a-33497908e35c` |
| F's test entry | `5b9f2571-4434-4f8c-8c0a-3e473a2af8bf` |
| E's test photo object | `photos/fac9ffe0-9a80-4515-8d38-e3f7647db914/7057c2a3-455e-49b7-bdee-dd203a747553/rls.jpg` (deleted, see clean-up) |

Account E (`gymfishes-e2e@example.com`, uid `7057c2a3-455e-49b7-bdee-dd203a747553`) and its group
"E2E" (`fac9ffe0-9a80-4515-8d38-e3f7647db914`) are the pre-existing Task 5 e2e fixtures, unchanged
by this task except for the seed/clean-up rows above. Per this task's instructions, accounts E and
F and F's profile row all stay — only the test rows and the test photo object were removed.

## Clean-up performed and confirmed

```
DELETE /storage/v1/object/photos/<E group>/<E>/rls.jpg                            [Bearer <E>]
  -> 200, {"message":"Successfully deleted"}

PATCH /rest/v1/entries?id=eq.<E entry>  {"deleted_at":"<now>"}                     [Bearer <E>]
  -> 200, 1 row, deleted_at set

PATCH /rest/v1/bottles?id=eq.<E bottle>  {"archived_at":"<now>"}                   [Bearer <E>]
  -> 200, 1 row, archived_at set

PATCH /rest/v1/entries?id=eq.<F entry>  {"deleted_at":"<now>"}                     [Bearer <F>]
  -> 200, 1 row, deleted_at set

DELETE /rest/v1/group_members?group_id=eq.<E group>&profile_id=eq.<F>             [Bearer <F>]
  -> 200, 1 row removed (F left E's group)
```

Confirmed by reads, all through E's own session:

```
GET /rest/v1/group_members?group_id=eq.<E group>&select=profile_id        [Bearer <E>]
  -> 200, [{"profile_id":"<E>"}]                          (group members = E only)

GET /rest/v1/entries?group_id=eq.<E group>&deleted_at=is.null&select=id,profile_id,total_ml  [Bearer <E>]
  -> 200, []                                              (no active test entry left)

GET /rest/v1/bottles?profile_id=eq.<E>&select=id,archived_at              [Bearer <E>]
  -> 200, [{"id":"6828c02d-...","archived_at":"2026-09-22T05:20:44.438+00:00"}]

POST /storage/v1/object/list/photos  {"prefix":"<E group>/<E>/","limit":100}  [Bearer <E>]
  -> 200, []                                              (photo object gone)
```

Nothing was ever written under the real group: the two checks that actually attempt a write
against the real group id (5b — upload; 6 — `group_members` insert) were both rejected by RLS as
shown in the results table above, and the closing admin queries confirm zero rows/objects under
the real group id or its storage prefix attributable to F's or E's uid. Checks 1, 5a and 5d are
reads against the real group (also all correctly denied or, for 5d, inconclusive on its own — see
the caveat above). Checks 3 and 4 target a different boundary entirely: they show F cannot write
E's rows even though both accounts share a group — E's throwaway "E2E" group, never the real
group — so they are not part of the "real group" write list at all. Check 7 writes nothing
anywhere (an invalid code short-circuits before any `insert`).

**All 7 negative checks pass. All positive controls pass. Clean-up confirmed. No BLOCKED items.**
