# M10 — Peixes novos e conquistas mais difíceis (design)

**Status:** the fish part was designed with Leo on the canvas on 2026-10-22 (rulings in §7, verbatim). The
roster changes and the achievements came in one message the same night, ending: "You can build everything
uninterrupted with this information. I'll review the fish once everything is done". So nothing below waits for
another answer: what Leo did not decide is the agent's call, listed in §8 for him to check at the end.
**Canvas:** https://claude.ai/artifact/UVfsN759ixhVdhbM4fozNR ("GymFishes M10"), rows "Peixes · quais estão
fracos?", "Peixes novos de água doce" and "Peixes novos · rodada 2".
**Reads with:** the main spec `2026-08-11-gymfishes-design.md` (§5.5 Perfil, §6 fish and unlocks, §7
celebrations, §8 design system), the aquarium design `2026-10-20-m10-aquario-design.md` (§3.1 habitat), the
handoffs `../plans/2026-10-21-m10-handoff.md` §2.2–2.3 and `../plans/2026-10-22-m10-handoff.md`, and `CLAUDE.md`.
**Scope:** M10 items 2.2 (fish) and 2.3 (achievements). The aquarium (2.1) has its own approved design; this
document only changes its habitat list. One plan builds all three:
`../plans/2026-10-22-m10-aquario-peixes-conquistas.md`.

## 1. Intent

> "some of them are underwhelming and ugly, maybe there is also a big difference in quantity of freshwater fish
> to saltwater fish" (2026-10-21)

> "the achievements feel a little too easy like you can unlock about 5 fish in just a day, so they should be a
> bit harder." (2026-10-21)

> "keep the 9, then just make another saltwater one like idk a Tuna, and maybe drop the Cavalo Marinho for a
> Barracuda, and swap the Polvo for a Swordfish, the turtle for a MAhi Mahi, and maybe the dolphin for a
> Grouper. I think it makes more sense, but remember they need to have a lot of effort put in them. Also for the
> achievements remember to make them harder and improve the gamification of the app, but it shouldnt be too
> grindy, like it should be achievable to get all fish in the course of like 4-5 months max." (2026-10-22)

The fish are the app's reward. Today some look cheap next to the tambaqui, the collection leans to the sea, and
the whole set is earned in about a month, five of them on day one. M10 makes every fish worth wearing, balances
river and sea nine to nine, and stretches the collection into a four-month journey where the big fish are the
trophies, with the progress toward each one visible.

## 2. Goals, non-goals, anti-goals

**Goals**
- Eighteen fish, nine freshwater and nine saltwater, every one drawn from real photos at the tambaqui's bar.
- A ladder of fourteen achievements (plus four starters) that a regular user completes in about four months,
  never more than five; the big fish at the end.
- Nothing is earned on the first day, and the early fish are spread over the first weeks instead of landing
  together.
- Every locked fish in the gallery shows how far you are ("12 de 30"), and the gallery shows how many you have.

**Non-goals**
- No new screen, tab, setting or notification. No schema change: unlocks stay derived from registers.
- No competition-based achievements (they depend on the partner's habits, not your own).
- No change to the celebration rules beyond the new streak milestone (30) the catalog already implies.

**Anti-goals** (a failure even if it works)
- Grind: an achievement that only a perfect or extreme user reaches, or one that cannot be earned at all by
  someone who drinks moderately.
- Any fish that reads as "a bunch of shapes put together" or has a weird mouth, face or head.
- Noise: unlock storms, progress UI that crowds the gallery, decoration on Hoje.

## 3. The roster

The gallery order is the ladder order (starters first, then quickest to slowest). Ids stay English where the
species has a common English name, Portuguese for the Brazilian species (as `tambaqui` already is).

| # | id | pt-BR | Habitat | Achievement, as shown | Regular user |
|---|---|---|---|---|---|
| – | `guppy` | Guppy | rio | Inicial | day 1 |
| – | `betta` | Betta | rio | Inicial | day 1 |
| – | `goldfish` | **Kinguio** | rio | Inicial | day 1 |
| – | `neon` | Neon | rio | Inicial | day 1 |
| 1 | `clownfish` | Peixe-palhaço | mar | Sequência de 3 dias | day 3 |
| 2 | `pufferfish` | Baiacu | mar | Antes das 9h em 5 dias | ~1,5 weeks |
| 3 | `tucunare` | Tucunaré | rio | Sequência de 7 dias | ~1–2 weeks |
| 4 | `tambaqui` | Tambaqui | rio | 10 dias com 2 L | ~2–3 weeks |
| 5 | `dourado` | Dourado | rio | 100 registros | ~3–4 weeks |
| 6 | `barracuda` | Barracuda | mar | Sequência de 14 dias | ~3–5 weeks |
| 7 | `mahimahi` | Mahi-mahi | mar | Um dia com 3,5 L | a stretch day, ~1–2 months |
| 8 | `grouper` | Garoupa | mar | 100 L acumulados | ~7 weeks |
| 9 | `pintado` | Pintado | rio | 60 dias com registro | ~2,3 months |
| 10 | `pirarucu` | Pirarucu | rio | Sequência de 30 dias | ~1–3 months |
| 11 | `tuna` | Atum | mar | 45 dias com 2 L | ~2,5 months |
| 12 | `swordfish` | Espadarte | mar | 400 registros | ~3,3 months |
| 13 | `shark` | Tubarão | mar | 200 L acumulados | ~3,3 months |
| 14 | `whale` | Baleia | mar | 120 dias com registro | ~4–4,5 months |

Gone: `octopus` (Polvo), `seahorse` (Cavalo-marinho), `turtle` (Tartaruga), `dolphin` (Golfinho). A profile
that still stores one of them shows its replacement, the swap Leo named: seahorse → barracuda, octopus →
swordfish, turtle → mahimahi, dolphin → grouper. Any other unknown value stays the guppy, as today. The
aquarium's small decor seahorse on the reef's kelp is scenery, not the fish, and stays.

**The order follows the animals' real size** (small reef fish, then the metre-long river fish, then the
two-to-six-metre giants, the whale last), so the collection reads as growing toward the big trophies, the way
Leo framed it: "These bigger fish are important for the achievement rankings in difficulty".

## 4. Art

**The bar** is the tambaqui (main spec §6; the agent's memory: traced from photos, accuracy over cuteness). The
four new river fish were drawn and redrawn on the canvas and approved; their files are the second reference:
`.tmp/m10/fish/pintado.ts`, `dourado.ts`, `tucunare.ts`, `pirarucu.ts` (git-ignored scratch; the build copies
them into `src/features/fish/svg/`).

**What was learned from Leo's reviews**, now the rules for every fish (the full drawing brief is
`.tmp/m10/fish/BRIEF.md`):
- Research many photos from several angles first and write down the anatomy: proportions, head length, eye
  position and size, the mouth (which jaw leads, how far the gape runs, lips or bony jaws, teeth), every fin.
- The mouth is cut into the outline (a notch plus a short cleft), never a line across a closed face and never
  two parallel lip lines.
- The gill cover is one arc in a darker body tone, not black. Pale lower jaws only where the species has them.
- One pattern per area, following the body: no scale arcs stacked on dots or stripes, no shading zone with a
  hard straight edge.
- Each drawing is checked beside its reference photo, at 900 px, at the tube's 56 px, the gallery's 140 px on
  the card and on the water, and as the locked silhouette.

**Who draws, and when it counts as done.** The agent draws the thirteen remaining fish through drawing agents,
one per species, each following `.tmp/m10/fish/BRIEF.md` (research, anatomy notes, at least three look-and-fix
rounds against photos) and writing only `.tmp/m10/fish/<id>.ts`. Acceptance is the agent's own review of each
drawing beside its reference photos at every size, with fix rounds until it meets the bar; Leo reviews the whole set
on the canvas at the end, the way he asked ("I'll review the fish once everything is done"). The build ports the
accepted files.

**Who is drawn**
- Kept as is: the tambaqui.
- Approved and ported: pintado, dourado, tucunaré, pirarucu.
- New, saltwater: atum (yellowfin tuna, *Thunnus albacares*), barracuda (great barracuda, *Sphyraena
  barracuda*), espadarte (swordfish, *Xiphias gladius*), mahi-mahi (*Coryphaena hippurus*, adult bull), garoupa
  (dusky grouper, *Epinephelus marginatus*, Brazil's garoupa-verdadeira).
- Redrawn in full (Leo's five worst, minus the polvo that leaves): baiacu, tubarão (great white), peixe-palhaço
  (*Amphiprion ocellaris*), kinguio (fantail goldfish).
- Redrawn at the same bar (Leo's "kinda meh"): guppy (male), betta (male halfmoon), neon (*Paracheirodon
  innesi*), baleia (humpback, *Megaptera novaeangliae*, the jubarte of Abrolhos).

**Habitats.** Every fish carries `habitat: 'fresh' | 'salt'` in the catalog. The aquarium (its design §3.1)
reads it; its habitat list becomes the table above. Every fish is checked once in its full habitat tube in the
built app (the canvas row "Todos os peixes" was the pattern) before the build is called done.

## 5. Achievements

### 5.1 What counts

All achievements stay **derived from your own live registers, never stored** (main spec §6), so there is no
table, no write and no drift. The kinds:

| Kind | Fact it reads (all-time) | Label |
|---|---|---|
| `starter` | — | Inicial |
| `streak` | longest run of consecutive registered days | Sequência de N dias |
| `mornings` | days with a register before H h (São Paulo wall clock, `hourOf`) | Antes das Hh em N dias |
| `goalDays` | days whose total reached X ml | N dias com X |
| `days` | days with at least one register | N dias com registro |
| `count` | live registers | N registros |
| `volume` | litres accumulated | X acumulados |
| `record` | best day reached X ml (at least, not "above") | Um dia com X |

The old same-day kinds (`bottle`, `note`, `morning` once) leave: they were the "5 fish in just a day".

**Pacing assumptions** (the "regular user" of the table's last column): registers on most days, about 2 L a day
on average with some days below, about four registers a day, a morning register about every other day. Under
those numbers the last fish lands around month four; a user who skips a day a week lands the whale around
month 4,6. Nothing needs a perfect month except the pirarucu's 30-day run, which has the whole four months to
happen.

### 5.2 Progress you can see (the gamification)

- **Each locked fish in the gallery** shows, under its achievement, the current number against the target as
  text and a slim bar: "12 de 30". Volumes in litres: records with one decimal ("2,8 de 3,5"), accumulated
  litres whole ("84 de 250"); everything else whole numbers. The number never exceeds the target; an unlocked
  fish shows no progress.
- **Streak fish show the current run**, not the longest ever: the target needs that many days in a row, so
  "4 de 30" (on day 4 of a new run, after a best of 20) is honest about what is left. It is the one number that can
  go down, like the streak chip on Hoje. The unlock itself still reads the longest run ever (§5.1), so a fish once
  earned never re-locks.
- **The gallery shows the collection**: "9 de 18 peixes" above the grid. The worn fish counts, as in the
  gallery's own rule that the fish you wear is always yours.
- **Streak milestones** for the full-screen streak celebration are read off the streak fish, so they become 3,
  7, 14 and 30 (the 30 is new).
- The onboarding picker (starters only) shows no progress.

### 5.3 What happens to fish already earned

Both members have used the app since August, so most facts carry over (registers, litres, days, the longest
streak), and many fish stay or become unlocked at once. Some fish they had will **re-lock** under the harder
targets (the shark's 50 registers become 400, for example). That is accepted, as the leanest path: no schema
change on the only database, and every condition stays an all-time fact, so nothing re-locks ever again after
this update. The fish each member wears stays theirs in the gallery, as today.

The celebration bookkeeping already handles this. `seen_unlocks` keeps a fish as seen only while it is unlocked
before the register being evaluated, so a re-locked fish is forgotten and is celebrated again when re-earned.
The fish that the new ladder unlocks straight away from old data (new species included) each get their unlock
screen, one per register, in ladder order, under the existing rule of at most one full screen per register.
That is the welcome to the new collection, not a storm.

## 6. Constraints

- `CLAUDE.md` holds: pt-BR only, every string in `src/lib/strings.ts`, numbers with a decimal comma via
  `formatVolume`, colours via tokens except the fish species palettes (the documented exception), flat fills and
  1 px lines, 44 px targets, files under about 200 lines, pure logic in `src/lib/` or the feature's pure module
  with unit tests, components read data through hooks.
- Dates only through `src/lib/dates.ts` (`hourOf`, day keys).
- No schema change; `src/lib/database.types.ts` untouched.
- `npm run test:run`, `npm run typecheck` and `npm run build` green before every commit.

## 7. Decided by Leo

- Worst five: "baiacu, tubarão, polvo, peixe palhaço, peixe dourado. The best one is the tambaqui, dont change
  him, the rest are all kinda meh but the ones I said need specially more treatment because they are the
  shittiest ones."
- New river fish: "other big fish like the tambaqui, such as the Pintado, the Dourado, the Tucunaré, the
  Arapaima … These bigger fish are important for the achievement rankings in difficulty".
- "kinguio is fine" (the goldfish's new name, freeing "Dourado").
- Round 1: "I liked the Pintado, maybe he just needs some adjustments in his mouth … their mouths are all weird
  as well as their faces and heads … the Dourado body is all shit … take a better look into real pictures of
  these fish from different angles, understand their anatomy, and then build them. The Pirarucu and Tucunaré
  bodies are fine … the tucunare's tail is a little small".
- Round 2: "all good, just put the mouth line of Tucunare lower, his lower jaw should be really thin and 'bass
  like' … after you do that I'll assume its approoved". Done the same night.
- The roster: keep all nine freshwater; add a tuna; barracuda for the seahorse, swordfish for the octopus,
  mahi-mahi for the turtle, grouper for the dolphin; "they need to have a lot of effort put in them".
- Achievements: harder, better gamification, not grindy, every fish within "4-5 months max".

## 8. The agent's calls, for Leo to check

- **The ladder itself** (§3): its order by real size, its fourteen targets and the new kinds (`mornings`,
  `goalDays`, `days`); 2 L as the "good day" and 3,5 L as the one stretch day, chosen so a moderate drinker can
  still finish; no achievement before day 3.
- **Re-lock accepted** (§5.3) instead of storing unlocks; the welcome unlock screens after the update.
- **Progress in the gallery** ("12 de 30" with a slim bar) and the collection count, the only new UI; streak fish
  count the current run (§5.2).
- **Names:** "Espadarte" (the Brazilian name for the swordfish; "peixe-espada" is a different fish),
  "Mahi-mahi" as Leo wrote it (its other Brazilian name, dourado-do-mar, would clash with the river Dourado),
  "Garoupa", "Atum", "Barracuda", "Pirarucu" (for the arapaima).
- **Species picks** where Leo named only the animal: yellowfin tuna, great barracuda, dusky grouper, the great
  white for the shark, the humpback for the whale, the fantail for the kinguio, the checkered puffer family for
  the baiacu (the agent drawing it confirms the most recognisable one).
- **Dropped fish map to their replacements** for anyone wearing them.

## 9. Left to the builder

- Where the facts and progress live (`src/features/fish/unlocks.ts` today) and their unit tests: every kind's
  `meets` and progress, the pacing table as a test fixture (a synthetic four-month "regular user" history must
  unlock the whale between days 100 and 150 and nothing on day 1 but the starters).
- The gallery's progress line and bar markup within the design tokens (`bg-line` track, `bg-water` fill, 4 px
  tall, the gallery's existing label styles), and its behavioural tests.
- Porting the art files into `src/features/fish/svg/`, the catalog (ids, `habitat`, names, `UNLOCKS`, legacy
  aliases in `fishOf`), the strings, the existing tests that name the old fish, the fish contact-sheet script
  (switch it to Chromium).
- Main-spec updates: §5.5 (gallery progress and count), §6 (the new roster, kinds, ladder, re-lock, aliases), §7
  (milestones 3/7/14/30), and the aquarium design's §3.1 habitat list; the ROADMAP's M10 row.
