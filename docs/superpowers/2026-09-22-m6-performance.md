# §1 criterion 4 — performance pass

Criterion: *cold start to interactive on 4G, installed to home screen: < 2 seconds.*

Run date: 2026-09-22 (America/Sao_Paulo project; Lighthouse `fetchTime` in the raw JSON
spans UTC ~04:37–05:57 across both rounds below).

**Status: revised after fix round 1.** Round 1 shipped four vendor chunks (react, supabase,
motion, query) and measured only the uncached path, which showed the split landing slightly
worse than a single bundle. Controller ruling for round 1: collapse to one vendor chunk, and
separately measure the path criterion 4 actually describes — an installed PWA's cold start,
served by its own already-active service worker — rather than only the uncached path. Both
are done below.

## Method

Lighthouse against the production preview (`npm run build && npm run preview`, port 4173),
route `/entrar`, mobile form factor, throttling method `simulate` (Lighthouse's default
"mobile" throttling profile — a simulated slow-4G/mid-tier-CPU network+CPU profile, not a
live-recorded trace). Chromium came from Playwright's bundled build (no system Chrome/Edge is
installed on this machine, no admin rights). Lighthouse version in every JSON's
`lighthouseVersion`: **13.5.0**. Machine: Windows 10.0.26200, Intel Core i5-13420H (12
logical cores), 17 GB RAM — not a dedicated benchmark rig; other local processes were running
throughout, which matters for the noisier metric below (TBT).

**Uncached first load** (the criterion's "before install" / precache-miss path — Lighthouse's
default behavior resets all storage before each run, so every visit is a stranger to the
origin):

```
CHROME_PATH='C:\Users\leofr\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe' \
npx --yes lighthouse http://localhost:4173/entrar --preset=perf --form-factor=mobile \
  --screenEmulation.mobile --throttling-method=simulate --chrome-flags="--headless=new" \
  --output=json --output-path=.superpowers/perf/<name>.json --quiet
```

Run once for the original single-bundle build (`before.json`), once for the four-vendor-chunk
build now reverted (`after.json`), once for the shipped single-vendor-chunk build
(`after-single-vendor.json`).

**Cold start with the shell precached** (the path criterion 4 actually names — "installed to
home screen"): this needs the same origin's service worker to have already installed and
activated *before* the measured navigation, with its Cache Storage intact. `--disable-storage-
reset` alone does not do this across two separate `npx lighthouse` invocations: chrome-launcher
allocates a brand-new temporary `--user-data-dir` for every CLI invocation and deletes it on
exit (confirmed by reading `chrome-launcher/dist/chrome-launcher.js`: `this.userDataDir =
this.userDataDir || this.makeTmpDir()` in `prepare()`, called fresh each launch), so a second
plain invocation still starts from an empty profile — verified empirically: a first attempt at
this method left the "second" run's `network-requests` audit showing full transfer sizes
(compressed, not cached) on every asset. The fix: launch one persistent headless Chrome myself
with a fixed profile directory and a fixed remote-debugging port, then point two separate
Lighthouse invocations at that one already-running instance via `--port`, which chrome-launcher
detects and reuses instead of spawning a new browser (`chrome-launcher.js`: "If an explicit port
is passed first look for an open connection... Found existing Chrome already running using port
X, using that."):

```
"C:\Users\leofr\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe" \
  --headless=new --remote-debugging-port=9333 \
  --user-data-dir="C:\Users\leofr\AppData\Local\Temp\lh-profile-m6" --no-first-run about:blank

npx --yes lighthouse http://localhost:4173/entrar --preset=perf --form-factor=mobile \
  --screenEmulation.mobile --throttling-method=simulate --disable-storage-reset --port=9333 \
  --output=json --output-path=.superpowers/perf/installed-prime.json --quiet
# (this navigation installs and activates the service worker on that persistent profile)

npx --yes lighthouse http://localhost:4173/entrar --preset=perf --form-factor=mobile \
  --screenEmulation.mobile --throttling-method=simulate --disable-storage-reset --port=9333 \
  --output=json --output-path=.superpowers/perf/installed.json --quiet
# (this second navigation, on the same profile, is what "cold start, shell precached" measures)
```

Verified via each JSON's `network-requests` audit: on `installed-prime.json` every asset's
`transferSize` matches its real gzip size (e.g. `vendor-*.js` at 180,888 bytes) — a genuine
network fetch. On `installed.json`, every asset's `transferSize` collapses to 127–179 bytes
(HTTP overhead only) while `resourceSize` (decoded size) stays the same — a service-worker
Cache Storage hit, not a network transfer. That is the evidence this second run is measuring
what it claims to.

## Results — five metrics, one row per measured path

| path | FCP | LCP | TBT | SI | interactive |
|---|---|---|---|---|---|
| uncached first load — before any split | 2.4 s | 2.5 s | 70 ms | 2.4 s | 2.6 s |
| uncached first load — four vendor chunks (measured, then reverted) | 2.7 s | 2.8 s | 310 ms | 2.7 s | 3.2 s |
| uncached first load — one vendor chunk (shipped) | 2.4 s | 2.5 s | 390 ms | 2.4 s | 3.1 s |
| cold start, shell precached — one vendor chunk (shipped) | 1.1 s | 1.1 s | 0 ms | 1.1 s | 1.1 s |

TBT is the noisiest of the five metrics on this shared, non-dedicated machine — round 1's
four-chunk build showed TBT ranging 70/310/100 ms across three back-to-back runs of the same
build, so the 390 ms on the shipped single-vendor row should be read as "elevated and noisy,"
not as a precise value; FCP/LCP/SI/interactive were the steadier signal across repeats. The
precached row's numbers were not repeated (each installed-prime + installed pair is expensive
to set up); they are a single measurement, reported as measured.

## Chunk sizes — JS and CSS assets only (`vite build` output, shipped single-vendor config)

| asset | raw | gzip |
|---|---|---|
| vendor-OMQdtl4Z.js | 611.34 kB | 182.06 kB |
| index-BKiPmAf7.js | 88.39 kB | 26.97 kB |
| rolldown-runtime-hePW80VL.js | 0.71 kB | 0.42 kB |
| **JS total** | **700.44 kB** | **209.45 kB** |
| index-CnxvsAlZ.css | 23.70 kB | 5.60 kB |
| vendor-BDVC77eU.css | 0.65 kB | 0.22 kB |
| **CSS total** | **24.35 kB** | **5.82 kB** |

For reference, the original single-bundle build: `index-BfwRgLhx.js` 694.11 kB / 206.50 kB
gzip, `workbox-window.prod.es5-*.js` 5.65 kB / 2.20 kB gzip, JS total 699.76 kB / 208.70 kB
gzip; CSS `index-Cz2IM6oK.css` 24.29 kB / 5.71 kB gzip. Total bytes shipped on a cold load are
essentially unchanged by chunking (700.44 kB vs. 699.76 kB raw) — chunking redistributes
bytes, it does not remove them. The `vite build` 500 kB warning is present for the shipped
config (`vendor-OMQdtl4Z.js` is 611.34 kB raw) — collapsing four chunks into one crossed back
over that threshold; this is expected and was not a goal of this round's ruling.

**Update re-download figure:** on a deploy where only app code changes (not React, Supabase,
motion, or TanStack Query's versions), the service worker's precache diff has to re-fetch only
`index-*.js` + `rolldown-runtime-*.js` — 89.10 kB raw / 27.39 kB gzip — instead of the whole
694.11 kB raw / 206.50 kB gzip single bundle. `vendor-*.js` keeps its content hash and is never
re-downloaded across such a deploy. This is the number the vendor-chunk split is for.

## Verdict against §1 criterion 4

The uncached first load measures a visit where no service worker is yet controlling the page —
a first-ever visit, or any precache miss — and on the shipped single-vendor build it does not
land under 2 seconds: LCP is 2.5 s and the interactive audit is 3.1 s. The cold start with the
shell served from the service worker's precache — the scenario verified above via
`network-requests`, where every asset came from Cache Storage rather than the network — is
well under 2 seconds: LCP 1.1 s, interactive 1.1 s, TBT 0 ms. Criterion 4 says "installed to
home screen," which is this precached path, not the uncached one — an installed PWA's
home-screen launch is served by its own already-active service worker, not by a fresh 4G
fetch of the shell — so measured on the path the criterion actually names, criterion 4 is met.
The vendor-chunk split (four chunks, per round 1, now collapsed to one per this round's
ruling) is kept for its effect on update cost, not on first-load speed: it does not reduce
total bytes shipped on either the uncached or the precached path, but it bounds what a future
deploy has to re-fetch to the ~89 kB (27 kB gzip) index chunk instead of the whole ~694 kB
(206 kB gzip) bundle, with no cost to the already-installed shell's precached cold start,
which the numbers above show is unaffected by chunking (both a single 690 kB bundle's and a
single 611 kB vendor chunk's worth of bytes are served from the same zero-network-cost
Cache Storage read).

## Verification (round 1 — four vendor chunks, reverted)

- `npm run test:run` — 67 test files, 397 tests, all passed.
- `npm run typecheck` — clean, no errors.
- `npm run e2e` — Playwright smoke spec passed.

## Verification (fix round 1 — single vendor chunk, shipped)

- `npm run test:run` — 67 test files, 397 tests, all passed.
- `npm run typecheck` — clean, no errors.
- `npm run e2e` — rebuilt `dist/` (only `index-*.js`'s hash changes across rebuilds, from the
  embedded `__BUILD_DATE__`; `vendor-*.js` keeps its hash), Playwright smoke spec
  `e2e/smoke.spec.ts` passed (entrar → 500 ml → Hoje → Ranking → reload → cleanup).

## Scope note

No screens or the celebration screen were lazy-loaded. The measurements above show why:
splitting further would add more discrete chunks and an offline seam (the service worker's
first install has to catch every chunk before the shell is fully offline-capable) for a route
that already needs all of this code on first render, with no byte reduction on the uncached
path and no effect at all on the precached path (already the metric that matters) to justify
it.
