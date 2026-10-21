# M10 — O tubo como aquário vivo (design, rascunho)

**Status:** DRAFT. Brainstorm in progress with Leo since 2026-10-20; nothing is built. Leo said "go" on
2026-10-21 and the first drawing (the full freshwater tube) is on the canvas, awaiting his reaction.
**Canvas:** https://claude.ai/artifact/UVfsN759ixhVdhbM4fozNR ("GymFishes M10").
**Reads with:** `2026-08-11-gymfishes-design.md` (§8 visual rules, §8 Motion), the M10 handoff
(`../plans/2026-10-21-m10-handoff.md` §2.1) and `CLAUDE.md`.

## 1. Intent, in Leo's words

> "the plain blue when the tube is full feels kinda shit … some minor bubbles going up, not a lot of
> bubbles and they need to be in bubble patterns which are kinda random, maybe also have some more
> decoration in the tube like water plants, kelp, coral … if the fish you are using is a freshwater
> fish, the decoration for the tube is inspired on rivers and lakes, if it's a saltwater fish, then
> its inspired by ocean and reefs. It's supposed to be in stages, so past a threshold, a decoration
> is added, all until it's full."

Asked what he sees in a full freshwater tube at the end of a good day (2026-10-20):

> "bubbles, a log or mangrove roots or both, water plants growing from the bottom and sides maybe,
> rocks maybe with some moss coming from the sides, and maybe some leaves that got in there floating
> mid water or even leaned in some stuff, then also some small critters if possible, like tiny shrimp,
> river crabs, or really small fish. I also thought about the water color gradually changing, from
> the normal blue to a 'river green', we could also try playing with some shadows and customization
> so each person can customize if the tube is plain, if the colors change, etc."

Asked what is already there at about a third, one litre in:

> "maybe some rocks, a few plants and the first bubbles."

## 2. What Leo decided (his rulings)

- **The full freshwater scene:** bubbles; a log or mangrove roots, or both; water plants growing
  from the bottom and from the sides; rocks along the sides with moss creeping in from the edges;
  a leaf or two drifting mid-water or leaning on something; tiny critters (shrimp, a river crab, very
  small fish). Everything arrives in stages as the day fills; the full tube is the whole scene.
- **At ~1 L:** some rocks, a few plants and the first bubbles are already there.
- **Water colour:** "gradually changing shades until the actual river water when it's full"; the
  ocean tube "should also have a gradient change to reflect more the ocean color". The change is
  over time, not a spatial gradient (spec §8 still forbids gradients on surfaces). **Only the tube's
  water changes.** Buttons and totals keep the blue token.
- **Customization:** for now only one switch, Enable/Disable "tube decorations and colour changes"
  together, **enabled by default**.
- **The bar:** keep the app's style, nothing heavy, and nothing "brute and looking like a bunch of
  shapes put together, which is the problem we have with the fish designs (except the tambaqui)".
  The tambaqui is the bar for every piece.
- The playback of §3's guesses as of the third message got "all good" from Leo, except where §2
  above refines it (water: gradual shades; toggle: one switch, on by default).

## 3. The agent's guesses (marked; Leo corrects them on the canvas)

- The water shade follows the level itself, every sip nudging it, rather than stepping at thresholds.
  Full means 3 L, the reference scale, even on a day someone drinks past it (the tube scale grows,
  the scene does not reset).
- The toggle sits in Perfil next to Tema and is stored per device like the theme
  (`localStorage`, see `src/features/theme/theme.ts`): no schema change. The plain tube is exactly
  today's tube. One device's toggle applies to every tube that device shows (it is a view setting).
- Pieces are flat shapes in the fish's own language: real silhouettes, three tones, 1px lines, depth
  from flat darker tones, never soft shadows or glow. One scene drawn by one hand.
- Decorations sit behind the water body / at the floor and never cover the fish, the crest or the
  totals. Critters sit still or barely drift; they are not a second animation layer.
- Bubbles: few, in irregular seeded-random patterns (reuse the idea of
  `src/features/celebrations/bubbleField.ts`, not its density); CSS keyframes on
  `transform`/`opacity` only; paused with the waves (`useWavePause`, `data-waves`); off under
  reduced motion.
- Saltwater is a reef with the same bones: coral and kelp instead of roots and moss, shells instead
  of leaves, a small crab or a cleaner shrimp as the critter, water moving toward an ocean colour.
- Habitat comes from the catalog: a `habitat: 'fresh' | 'salt'` field per fish
  (`src/features/fish/catalog.ts`). Today: freshwater guppy, betta, goldfish, neon, tambaqui;
  saltwater clownfish, pufferfish, seahorse, octopus, turtle, dolphin, shark, whale.
- Per-habitat decor palettes and the two water end-colours are a documented exception to
  tokens-only colours, like the species palettes (spec §8).
- Stage thresholds: likely the calendar's own steps (`fillStep` in `src/lib/calendar.ts`: <1 L,
  1–2 L, 2–3 L, 3 L+) or every 500 ml; to be settled on the canvas with the stage ladder.

## 4. Constraints

- The tube is 160×220 px (`src/screens/hoje/MemberTube.tsx`, `TUBE_H`): a shrimp is about ten
  pixels; every piece must read at that size on an iPhone.
- Dark theme only; tokens from `src/styles/tokens.css` except the documented decor exception.
- Flat fills, 1px lines, no gradients, no glow, no shadow on surfaces (spec §8).
- `prefers-reduced-motion`: no bubbles, no drifting; the scene stays, still.
- Simplicity: one toggle, no further options, no new screen. Strings in `src/lib/strings.ts`.
- The water level spring is 1 s with bounce 0.25 and the number counts over 1 s (2026-10-20).

## 5. Open, to settle on the canvas after the "go"

1. The full freshwater tube at real size (stills) — the first thing Leo sees.
2. The stage ladder: what arrives at 1,5 / 2 / 2,5 / 3 L, and how many stages.
3. The river-green and ocean end-colours and the shade curve.
4. Which critter(s) per habitat, and whether anything drifts.
5. Leaves: floating mid-water or leaning on the roots.
6. The reef scene, same ladder.
7. The bubbles, as a GIF.
8. The toggle's pt-BR label and its place in Perfil.

## 6. Next step

On Leo's "go": draw the full freshwater tube on the canvas at real size (a still in the real Hoje
card, via the backend stand-in), then the ladder, then the reef, then the bubbles GIF. Decisions
happen on his phone. After the brainstorm closes, this draft becomes the design, gets the builder
check, and a plan follows (`superpowers:writing-plans`).

## 7. Drawing 1 (2026-10-21): the full freshwater tube

On the canvas, row "Aquário de rio": today's card (also the look with the toggle off), the proposal
at real size (Leo at 3,05 L with the full scene, Ana at 1 L with rocks, a few plants and the first
bubbles) and the full tube at 2×. Mockup source, git-ignored: `.tmp/m10/scene.mjs` (the scene, each
piece tagged with its litre mark) and `.tmp/m10/capture.mjs` (injects it into the real Hoje card via
the backend stand-in, scenario `aquario`).

The agent's calls in this drawing, for Leo to accept or overturn:

- **The crest follows the tube's water.** It is the water's surface; a blue crest on green water reads
  broken. (Corrects the earlier guess that the crest keeps the blue token.)
- **River water at 3 L: `#2A9C80`, crest `#6ACDB2`.** The shade moves from today's blue in OKLab,
  linearly with the litres. Ocean end-colour proposed as `#1769C2` / `#4F98E6`, not drawn yet.
- **Decor recedes, the fish leads.** Every decor tone is muted and pulled toward the river green; the
  member's fish keeps its full species palette on top.
- **Depth from a far plane:** grass silhouettes in one flat tone a step darker than the water, no
  outline (`mix(water, bg, 0.24)`), behind everything.
- **Technique:** organic pieces (roots, grass) are tapered ribbons along curves with a slightly uneven
  width; moss is a cluster of round cushions sharing one outline. Outlines in each piece's darkest
  tone, 0.5–1 px. No gradient, glow or shadow.
- **Composition:** boulder with moss on the left wall, a sunken log with a broken end and a cut face
  across the floor, prop roots springing from a trunk base at the right wall, Vallisneria among the
  roots and on the left, an Amazon sword behind the log, an ochre leaf drifting mid-water and a rust
  leaf leaning on the log, a shrimp on the log, a crab among the root feet, bubbles in two loose
  columns. Nothing above the fish's band at the top.
- **Provisional litre marks** (only 1 L and 3 L were judged): 0,5 L floor and rocks; 1 L short grass
  and first bubbles; 1,5 L log and sword plant; 2 L roots, tall grass, far plane, moss; 2,5 L leaves,
  shrimp, more bubbles; 3 L crab.
- Not in this drawing: tiny fish (Leo listed "shrimp, river crabs, or really small fish"; shrimp and
  crab were picked to keep the hero fish unambiguous), bubble motion, the reef.

## 8. Round 2 (2026-10-21)

Leo on drawing 1:

> "first of all, for now I love it, couple changes I'd make is to add a couple more leaves, spread the
> bubbles a bit more (remember they need an animation going up), the mangrove roots are also a little
> weird on the side, try searching on how to make them look better. Maybe add some really small school
> fish shadows in the background or even a bit below the actual fish, whichever you think is best"

> "the thing I found off with the roots were their shape and how they were placed, and not the color,
> the color was fine"

What changed (canvas row "Aquário de rio · rodada 2": the card at real size and the full tube as an
8 s GIF at 2×):

- **Roots, reshaped and replaced; colours untouched.** Research: red mangrove prop roots drop from
  branches above the water and arch toward the mud, carry pale air pores (lenticels), and illustrators
  split and thin each root near the bottom, layer roots front and back, and shade one side with
  irregular marks. So the roots no longer grow out of a bulge in the wall: three thick woody prop roots
  and one darker root behind enter at the water surface from the top-right (the tree is above the
  water), bend down with the prop-root shoulder, fork and splay into the riverbed. The fish's band at
  the top stays clear. Two tall grass blades on the right were removed so the roots read.
- **Leaves:** four now. An ochre one and an olive-brown one drift mid-water, a rust one leans on the
  log, another rust one lies on the riverbed.
- **School (agent's call on placement):** eight tiny fish shadows just below the member's fish, in the
  far plane's depth: one flat tone a step darker than the water, no outline, heading left and slightly
  up. Still, not animated.
- **Bubbles, animated:** five sources spread across the floor (short grass, sword plant, log knot, root
  feet, boulder), each joining at its litre mark. Each lets out a seeded burst of one to three bubbles
  once per 8 s, so the tube never shows a regular rhythm and about four or five are up at once. A bubble
  rises in a straight line at 39–48 px/s (bigger is faster), sways sideways 0.6–1.8 px, grows from 0.8
  to 1.12 and fades out at the surface. Radius 1.5–3 px. CSS keyframes on transform and opacity only;
  in the build they pause with the waves (`data-waves`) and are hidden under reduced motion.

Builder note: the mockup scene SVG is about 140 KB (moss is many circles). The build should draw each
habitat once, keep the piece list small, and never recompute paths per render.
