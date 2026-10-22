# M10 — O tubo como aquário vivo (design)

**Status:** designed with Leo on the canvas, 2026-10-20 to 2026-10-22; every visual decision below was
approved there. A builder check found two points, both folded in (§3.4 tube width, §6/§7).
**Approved by Leo as written on 2026-10-22** ("thats good"), including the agent's calls in §7.
Built on branch m10 (2026-10-22): `src/features/aquarium/`, wired into `src/screens/hoje/MemberTube.tsx`.
**Canvas:** https://claude.ai/artifact/UVfsN759ixhVdhbM4fozNR ("GymFishes M10"), the visual record.
**Art reference (committed):** [`2026-10-20-m10-aquario/river.mjs`](2026-10-20-m10-aquario/river.mjs) and
[`reef.mjs`](2026-10-20-m10-aquario/reef.mjs): the approved drawing, as code that generates the SVG. Every
shape, colour and position Leo approved is there. Port it; do not redraw it.
**Reads with:** the main spec `2026-08-11-gymfishes-design.md` (§5.1 Hoje, §5.5 Perfil, §6 fish, §8
design system and motion), the M10 handoff `../plans/2026-10-21-m10-handoff.md` §2.1, and `CLAUDE.md`.
**Scope:** handoff §2.1 only. The fish redraw and habitat balance (§2.2) and the harder achievements
(§2.3) are separate M10 items with their own brainstorms.

## 1. Intent

Leo, on the plain tube:

> "the plain blue when the tube is full feels kinda shit … some minor bubbles going up … more decoration
> in the tube like water plants, kelp, coral … if the fish you are using is a freshwater fish, the
> decoration for the tube is inspired on rivers and lakes, if it's a saltwater fish, then its inspired by
> ocean and reefs. It's supposed to be in stages, so past a threshold, a decoration is added, all until
> it's full."

The tube is the heart of Hoje. Today a full day looks the same as an empty one with more blue. M10 turns
the day's water into a small aquarium that fills up with life as you drink, so every drink visibly adds
something and a full tube feels like a reward.

## 2. Goals, non-goals, anti-goals

**Goals**
- A full tube looks alive: a river scene for freshwater fish, a reef for saltwater fish.
- The scene builds in steps as the day's water rises, so nearly every drink adds a piece.
- The tube's water shifts gradually from the theme's blue to river green or ocean blue.
- A few bubbles rise in irregular bursts.
- One switch in Perfil turns the scene and the colour shift off, back to today's plain tube.

**Non-goals**
- No new screen, no new navigation, no options beyond the one switch.
- No schema change and nothing synced: the switch is a per-device view setting.
- Nothing in the scene is tappable or interactive.
- No new animation library: CSS keyframes and the existing `motion`.
- No change to how litres map to water height, to the ranking, or to celebrations.

**Anti-goals** (would make it a failure even if it works)
- Heavy or busy: the app stays quiet and the tube stays legible at 160×220 px on an iPhone.
- "A bunch of shapes put together": every piece must meet the tambaqui's bar (real silhouettes, flat
  tones, outline in the darkest tone), the way the approved art does.
- Decor competing with the member's fish: the fish stays the brightest, sharpest thing in the tube.
- Water that lies: the water's height keeps measuring litres exactly as today.
- Jank: the Hoje screen must stay smooth on the phone with two (or more) living tubes.

## 3. What the member sees

### 3.1 Habitat

Every fish has a habitat, nine and nine (fish spec §3). Freshwater (river): guppy, betta, goldfish,
neon, tucunaré, tambaqui, dourado, pintado, pirarucu. Saltwater (reef): clownfish, pufferfish,
barracuda, mahi-mahi, grouper, tuna, sailfish, shark, whale. Each member's tube
shows the habitat of the fish **that member** wears: Leo's clownfish tube is a reef next to Ana's betta
river (canvas "Recife · 3 L, ao lado do rio da Ana"). Changing fish changes the scene at once.

### 3.2 Water colour

The tube's water moves from the **active theme's** water and crest colours (`THEMES[theme].water`,
`.waterHi` in `src/features/theme/themes.ts`) at 0 ml to the habitat's colours at 3 L, mixed in OKLab,
linear in millilitres, capped at 3 L:

| Habitat | Water at 3 L | Crest at 3 L |
|---|---|---|
| River | `#2A9C80` | `#6ACDB2` |
| Reef | `#1769C2` | `#4F98E6` |

Only the tube's water changes: the water body, both wave layers of the crest and the reduced-motion
crest band. Buttons, totals, the Registrar sheet, the calendar and everything else keep the theme's
water token. (One clean way: set `--color-water` and `--color-water-hi` as inline custom properties on
each tube's root, so the existing `bg-water` / `fill-water` classes inside it pick up the mix. Left to
the builder.)

### 3.3 The ladder

One step every 0,5 L, the same steps for both habitats. The river builds from the bottom up: floor
pieces first, mid-water pieces last, once the member's fish has risen above them.

| Water | River | Reef |
|---|---|---|
| 0,5 L | plain water | plain water |
| 1 L | riverbed, a boulder and rocks, short grass, first bubble source | sand, reef rock with small encrusting corals, a brain coral, yellow finger corals, first bubble source |
| 1,5 L | a sunken log, an Amazon sword plant, second source | a branching (staghorn) coral, a purple sea fan, second source |
| 2 L | shrimp on the log, a crab, a leaf on the log and one on the riverbed, moss on the boulder and the log, the first two mangrove roots, third source | starfish, sea urchin, two shells, an anemone on the rock, the anchor with its chain, third source |
| 2,5 L | the whole root fan, tall grass, the far bank, fourth source | kelp, a small seahorse holding it, the far reef, fourth source |
| 3 L | a school of fish shadows, two drifting leaves, fifth source | a school of fish shadows, two small moon jellyfish, fifth source |

The art reference tags every piece and bubble source with its mark (`at`) in this order.

### 3.4 Rules of the scene

- **Position and paint order** are the art reference's: the scene box is the tube's inner area,
  156×216 px, anchored to the tube floor; pieces paint back to front as listed there.
- **The scene fits the tube's real width.** The tube is fluid (`min-w-[140px] max-w-[160px] flex-1`),
  so its inner width runs from 156 px down to about 151 px on a 375 pt phone and 136 px in the strip
  of three or more members. The drawing is fitted to that width at full height, anchored to the floor
  (a horizontal squeeze only), so wall pieces stay against the walls and the roots and chain still come
  from the top. The squeeze is at most about 3 % on two-member phones (checked at 375 pt) and up to
  13 % in the strip.
- **A piece shows once its mark is reached.** A mid-water piece (school, drifting leaves, jellyfish)
  also waits until the water covers it entirely; this matters only when the tube's scale grows past
  3 L because someone drank more and every tube's water sits lower.
- **The roots and the chain come from above.** Once they arrive they run from the top of the tube,
  through the air above the water and into it, like a mangrove's tree or a boat above the water. Their
  part above the water is drawn too, and overlaps the underwater part by about 1,5 px so no seam shows.
- **Layering, back to front:** tube background → water body → crest → scene (clipped to the water) →
  roots or chain above the water (clipped to the air) → the member's fish. The scene sits **above** the
  crest so the waves pass behind the roots and the chain instead of washing over them. Nothing ever
  covers the fish, and nothing reaches the totals below the tube.
- **The fish rides up in shallow water.** It sits 6 px under the crest, but never lower than
  `water height − fish height`, so it is never cut by the tube's floor (today at 0,5 L the fish's belly
  is clipped). This applies with the switch on and off. The fish still appears only once the water is
  as tall as the fish, as today.
- **Past 3 L** the scene stays full and the water stays at the habitat colour.

### 3.5 Bubbles

Few, irregular, always rising (approved as drawn in the round-2 GIF):

- Five sources per habitat, spread across the floor, each joining at its mark (positions in the art).
- Each source lets out a seeded burst of 1 to 3 bubbles once per 8 s period, so the tube never shows a
  regular rhythm; about four or five are up at once at a full tube.
- A bubble rises in a straight line at `30 + 6 × radius` px/s from its source to 6 px under the
  surface, sways sideways 0,6–1,8 px (ease-in-out, alternate, 0,8–1,5 s), grows from 0,8 to 1,12,
  fades in over the first 6 % of its rise and out over the last 10 %. Radius 1,5–3 px.
- Colours: fill = the tube's current water mixed 30 % toward white, rim = the current crest colour at
  0,9 px, one highlight dot `#EAFBF5`.
- CSS keyframes on `transform` and `opacity` only. Paused with the waves (`data-waves="paused"` from
  `useWavePause`, which pauses offscreen and in a hidden tab). Hidden under `prefers-reduced-motion`.

### 3.6 When a piece joins

The agent's call (not discussed with Leo): when a drink crosses a mark while Hoje is open, the new
pieces fade in over 400 ms ease-out (opacity only) as the water reaches them. Pieces already earned
when Hoje opens are simply there. Under reduced motion they appear without a fade.

### 3.7 The switch

In the Perfil card, right under Tema (canvas "Perfil · a escolha do tubo"):

- Heading **"Tubo"**, in the same style as "Cor" and "Tema".
- The existing two-option selector (`src/ui/Segmented.tsx`): **"Com cenário"** (default) and
  **"Só água"**. ("Aquário" was avoided: it is already the name of a theme in the same card.)
- Stored per device in `localStorage`, like the theme (`src/features/theme/theme.ts` is the pattern),
  and read with the same care for blocked storage. It applies to every tube that device shows.
- "Só água" is exactly today's tube: the theme's blue, no scene, no bubbles, no colour shift. The fish
  lift from §3.4 still applies.

### 3.8 Reduced motion

The scene is shown, still: no bubbles, no fade-ins. The crest already becomes a static band under
reduced motion (main spec §8) and takes the tube's mixed crest colour.

## 4. Art

- **Port the reference.** `river.mjs` and `reef.mjs` hold every approved piece. Their techniques:
  a *piece* is a body silhouette, flat tones clipped to it and an outline in its darkest tone; organic
  pieces (roots, grass, coral branches, kelp) are tapered *ribbons* along cubic curves with a slightly
  uneven width; moss is a cluster of round cushions sharing one outline; the chain alternates face-on
  rings and side-on bars. No gradients, glow or shadows anywhere.
- **Palettes** are hex constants per habitat, a documented exception to the tokens-only rule, the same
  as the fish species palettes (main spec §8). Every reef tone is pulled 15 % toward the ocean blue (the
  sea fan 30 %, sand and shells 8 %); the river palette is already sunk toward its green. The far bank,
  the far reef, the school and the jellyfish derive their tones from the tube's current water.
- **The decor recedes, the fish leads.** All thirteen fish were checked in their full habitat tube and
  stay legible (canvas "Todos os peixes"). The whale on the reef is the weakest case and holds.
- **Ids are unique per tube**, since two or more tubes share the page (the reference prefixes clip ids).
- **Weight.** The reference builds about 150 KB of SVG per full tube (moss is many circles) and computes
  every path at runtime. The build must not recompute paths per render; how (precomputed path data
  committed like `src/features/fish/svg/*.ts`, memoized per step, simplified moss) is left to the
  builder, with the bar that Hoje stays smooth on the phone.

## 5. Constraints

- `CLAUDE.md` holds: pt-BR only, every string in `src/lib/strings.ts` ("Tubo", "Com cenário",
  "Só água"), colours via tokens except the documented palettes, flat fills and 1 px lines, 44 px
  targets (the selector already meets it), files under about 200 lines (split the art per habitat and
  per group of pieces), pure logic in `src/lib/` with unit tests, components read data through hooks.
- The water level spring is 1 s with bounce 0,25 and the count-up 1 s (settled 2026-10-20).
- `src/lib/database.types.ts` is untouched: no schema change.

## 6. Decided by Leo

Every visual decision was taken on the canvas; his words are in the appendix.

- The full river scene and the full reef, as drawn (round 3 of the river, the reef as first drawn
  after one calming pass).
- Bubbles as drawn in round 2: spread, rising, irregular.
- The mangrove roots' shape and placement as in round 3 (their colour was always fine).
- The school as one flowing curved shape.
- The ladder, one step every 0,5 L, with plain water at 0,5 L and the fish riding up in shallow water.
- Gradual water colour toward river green and ocean blue, in the tube only.
- One switch, on by default, "Tubo: Com cenário / Só água", in Perfil.
- Shrimp and a crab as the river's critters (he loved the drawing that has them; tiny fish live on as
  the school of shadows).
- The decor seahorse stays when the member wears the seahorse (he saw both in the all-fish strip).

## 7. The agent's calls, for Leo to check

- The colour shift starts from the active theme's water, not from one fixed blue.
- Mid-water pieces wait until the water covers them (only visible when the scale passes 3 L).
- New pieces fade in over 400 ms when a drink crosses a mark; no fade on opening Hoje. This is the one
  mechanism nobody asked for: without it a piece pops in mid-rise.
- The switch applies to every tube on the device, including the partner's.
- On narrower tubes the drawing is squeezed horizontally to fit (§3.4).

## 8. Left to the builder

- How the scene is structured in code (components, files, precomputed paths), within §4's weight bar.
- How the per-tube water colour is applied (custom properties on the tube root are suggested).
- The `localStorage` key name and the hook for the switch.
- Where the `habitat` field lives (the catalog entry is the natural place) and how the scene reads it.
- Test design: the ladder, the colour mix and the fish lift are pure functions with unit tests; the
  switch and reduced motion get behavioural tests; the art is verified by screenshots against the
  canvas.
- Main-spec updates when building: §5.1 (the tube), §5.5 (Tubo), §6 (habitat), §8 (the decor palette
  exception, bubbles and the fade-in in Motion), and the ROADMAP's M10 row.

## Appendix: how we got here

**2026-10-20.** Asked what a full freshwater tube looks like at the end of a good day:

> "bubbles, a log or mangrove roots or both, water plants growing from the bottom and sides maybe, rocks
> maybe with some moss coming from the sides, and maybe some leaves that got in there floating mid water
> or even leaned in some stuff, then also some small critters if possible, like tiny shrimp, river crabs,
> or really small fish. I also thought about the water color gradually changing, from the normal blue to
> a 'river green' … customization so each person can customize if the tube is plain, if the colors
> change, etc."

> "for the water I was thinking of gradually changing shades until it the actual river water when its
> full, and the color changes only the color in the tube, and not the buttons. The Ocean water should
> also have a gradient change … The customization for now should be only to Enable/Disable the tube
> decorations and color changes, but should be enabled by default. Remember to keep the style of the app
> and not make something too heavy, but also not brute and looking like its a bunch of shapes put
> together which is just the problem we have with the fish designs (except the tambaqui, I really like
> him)"

> At one litre: "maybe some rocks, a few plants and the first bubbles."

**2026-10-21, drawing 1** (the full river tube): "first of all, for now I love it, couple changes I'd
make is to add a couple more leaves, spread the bubbles a bit more (remember they need an animation going
up), the mangrove roots are also a little weird on the side, try searching on how to make them look
better. Maybe add some really small school fish shadows in the background or even a bit below the actual
fish, whichever you think is best." Then: "the thing I found off with the roots were their shape and how
they were placed, and not the color, the color was fine."

The roots were redrawn from research: red mangrove prop roots drop from branches above the water and
arch into the mud (Wikipedia, *Rhizophora mangle*; UF/IFAS), carry pale air pores (KAUST factsheet), and
illustrators split and thin each root near the bottom and shade one side unevenly (Easy Drawing Guides;
Fountain Pen Network).

**Round 2:** "ok yeah thats perfect, only make the school of fish in a more 'natural shape' and the water
and the top of the roots are bugging a little, probably because of the animation. just resolve these two
and I think we are done with this part." (The crest slid over the root tops; the preview GIF also jumped
at its loop.)

**The ladder:** asked what arrives at 2 L: "maybe the leaves, the log, the critters, and maaaybe
partially the roots, idk what do you suggest?" On the proposal: "I think its perfect, i just think in the
first one the fish is too deep in the ground, so maybe we bring him and the water a bit up? or even just
lose the ground and keep it basic with just water and also bring it a bit up, what do you think." The
agent recommended losing the ground at 0,5 L and lifting the fish, not the water, which keeps measuring
litres; the canvas shows it and the ladder was settled.

**2026-10-22, the reef:** "i would kinda need your help with this one, it should be similar but with
coral, sea urchin maybe and starfish, maybe an anchor with a chain coming down from the top to feel like
an alternative to the roots, some seahorses maybe … if you think of something better go ahead and mix it
in." The agent added the anemone (the clownfish's home), kelp, shells, the sea fan and moon jellyfish,
and pulled the reef's colours toward the ocean so the fish leads. Leo: "I think its fine."

**The switch:** "yes, its all fine."

**This document:** "thats good … this right here is approved".
