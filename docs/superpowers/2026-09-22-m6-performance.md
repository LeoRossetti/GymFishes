# §1 criterion 4 — performance pass

Criterion: *cold start to interactive on 4G, installed to home screen: < 2 seconds.*

Run date: 2026-09-22 (America/Sao_Paulo project; Lighthouse `fetchTime` in the raw JSON is
UTC ~04:37–04:47).

## Method

Lighthouse against the production preview (`npm run build && npm run preview`, port 4173),
route `/entrar`, mobile form factor, throttling method `simulate` (Lighthouse's built-in
mobile preset — its default "mobile" throttling profile, a simulated slow-4G/mid-tier-CPU
network+CPU profile, not a live-recorded trace). Chromium came from Playwright's bundled
build (no system Chrome/Edge is installed on this machine, no admin rights):

```
CHROME_PATH='C:\Users\leofr\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe' \
npx --yes lighthouse http://localhost:4173/entrar --preset=perf --form-factor=mobile \
  --screenEmulation.mobile --throttling-method=simulate --chrome-flags="--headless=new" \
  --output=json --output-path=.superpowers/perf/before.json --quiet
```

Same command, `--output-path=.superpowers/perf/after.json`, run after rebuilding with the
vendor-chunk config and restarting `npm run preview` so the server serves the new `dist/`.

- Lighthouse version (from both JSON's `lighthouseVersion`): **13.5.0**
- Machine: Windows 10.0.26200, Intel Core i5-13420H (12 logical cores), 17 GB RAM. Not a
  dedicated benchmark rig — other local processes (this agent's own tooling) were running
  during both measurements, which matters for the CPU-bound metric below.
- The `interactive` audit key was present in both JSON files under this Lighthouse version,
  so all five metrics are reported (no fallback needed).

## Results — five metrics, before vs. after

| metric | before | after |
|---|---|---|
| first-contentful-paint | 2.4 s | 2.7 s |
| largest-contentful-paint | 2.5 s | 2.8 s |
| total-blocking-time | 70 ms | 310 ms |
| speed-index | 2.4 s | 2.7 s |
| interactive | 2.6 s | 3.2 s |

**These numbers moved in the wrong direction, and that is reported as measured — not
rounded, not reframed.** A one-off repeat of the "after" configuration (same server, no
rebuild, kept only as a reproducibility check and not written over the required
`after.json`) gave FCP 2.9 s / LCP 2.9 s / TBT 100 ms / SI 2.9 s / TTI 3.1 s: FCP/LCP/SI/TTI
were consistently at or above the official "after" run, while TBT swung widely (70 → 310 →
100 ms across the three runs). TBT is the noisiest of the five here and should not be read
literally run-to-run on this shared machine; FCP/LCP/SI/TTI moved consistently worse, by a
few hundred milliseconds, across both after-runs.

The likely mechanism: total JS bytes shipped on a cold, uncached load are essentially
unchanged (see chunk table below — 699.76 kB raw / 208.70 kB gzip before vs. 699.17 kB raw /
210.51 kB gzip after, i.e. gzip total is very slightly *larger* split than whole, since
per-file gzip loses some cross-chunk compression overlap). What changed is the request
count: 2 JS files before (main bundle + workbox-window) vs. 7 after (index, four vendor
chunks, workbox-window, plus a small rolldown-runtime chunk). `index.html` does carry
`<link rel="modulepreload">` for all four vendor chunks, so the browser fetches them in
parallel rather than discovering them serially — but under Lighthouse's simulated slow-4G
profile (high RTT, constrained throughput), more discrete requests over the same total bytes
still cost more than one contiguous transfer, and that cost was not offset by any reduction
in bytes on this route, because `/entrar` needs the same vendor code either way.

## Chunk sizes — JS and CSS assets only (`vite build` output)

Before (single ~690 KB chunk):

| asset | raw | gzip |
|---|---|---|
| index-BfwRgLhx.js | 694.11 kB | 206.50 kB |
| workbox-window.prod.es5-Bd17z0YL.js | 5.65 kB | 2.20 kB |
| index-Cz2IM6oK.css | 24.29 kB | 5.71 kB |
| **JS total** | **699.76 kB** | **208.70 kB** |

After (vendor chunks split out):

| asset | raw | gzip |
|---|---|---|
| react-C6sfxaFO.js | 226.20 kB | 72.39 kB |
| supabase-BETuVjNU.js | 208.65 kB | 53.98 kB |
| motion-l6LDg-SZ.js | 131.72 kB | 43.18 kB |
| index-BKKJIS8r.js | 88.95 kB | 27.18 kB |
| query-JZI_xo3w.js | 37.42 kB | 11.22 kB |
| workbox-window.prod.es5-Bd17z0YL.js | 5.65 kB | 2.20 kB |
| rolldown-runtime-CbXtAM7H.js | 0.58 kB | 0.36 kB |
| **JS total** | **699.17 kB** | **210.51 kB** |
| index-Cz2IM6oK.css (unchanged, same hash) | 24.29 kB | 5.71 kB |

The `vite build` warning about a chunk over 500 kB is gone; no chunk exceeds 226 kB raw
after the split. `index.html` grew from 0.86 kB to 1.25 kB (five `modulepreload` links
added); that is metadata, not a JS/CSS asset, and is not counted in the totals above.
Fonts (three woff2 + three woff) and icons are unchanged by this task, as expected.

**What actually changed for the deploy story:** on the next code deploy, if only app code
changes (not React/Supabase/motion/TanStack Query versions), the service worker's precache
diff only needs to re-download the ~89 kB (27 kB gzip) `index-*.js`, instead of the whole
~694 kB (206 kB gzip) bundle. That is the property this task set out to build — stable
vendor chunks across deploys — and it is a property about *update* cost, not about the
*first* cold load measured here.

## Verdict against §1 criterion 4

On this simulated-slow-4G, uncached first load of `/entrar`, neither the before nor the
after build lands under 2 seconds for LCP (2.5 s / 2.8 s) or for the interactive audit
(2.6 s / 3.2 s) — the vendor-chunk split did not bring the cold, network-bound load under
the 2-second bar, and on these single-run measurements it landed slightly worse, most
plausibly because splitting into more requests does not reduce total bytes on a route that
needs all four vendor libraries regardless. This criterion, though, describes a PWA
"installed to home screen," and that is a different code path from what Lighthouse measured
here: once the service worker has completed its first install, the app shell (HTML, CSS, and
all these JS chunks — the precache glob already covers `**/*.js`) is served from the
precache with no network round trip at all, so an installed phone's cold start is bounded by
parse-and-execute time on the device, not by 4G transfer time. The numbers above do not
speak to that scenario one way or the other — they measure the uncached path, which is what
a first-ever visit (before install) or a precache miss experiences. The vendor-chunk split
still has real, measured value: it cuts what a returning installed user's service worker has
to re-fetch on the next deploy from ~206 kB gzip to ~27 kB gzip, at no cost to the
already-installed shell's steady-state behavior.

## Verification

- `npm run test:run` — 67 test files, 397 tests, all passed.
- `npm run typecheck` — clean, no errors.
- `npm run e2e` — rebuilt `dist/` (vendor chunk hashes unchanged; `index-*.js` hash changed
  because `__BUILD_DATE__` is embedded at build time), Playwright smoke spec
  `e2e/smoke.spec.ts` passed (entrar → 500 ml → Hoje → Ranking → reload → cleanup).

## Scope note

No screens or the celebration screen were lazy-loaded. The measurements above show why:
splitting further would add more discrete chunks and an offline seam (the service worker's
first install has to catch every chunk before the shell is fully offline-capable) for a
route that already needs all of this code on first render, with no byte reduction to justify
it.
