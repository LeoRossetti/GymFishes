# GymFishes — M7: Redesign visual e casca do PWA

**Data:** 2026-09-24
**Status:** implementado — aguardando verificação do Leo nos dois iPhones
**Autor:** Leonardo Rossetti Francatto (com Claude)
**Amends:** [`2026-08-11-gymfishes-design.md`](2026-08-11-gymfishes-design.md) §5.1, §5.5, §6, §8, §9, §16
**Mockups:** Design canvas "GymFishes M7 direções visuais" (private artifact, Leo's account)

> Behaviour does not change in M7. Every register, ranking, streak and sync rule from the main
> spec stands. This milestone changes how the app is framed on the phone, how it looks, and how
> the fish are drawn. Strings de interface aparecem entre aspas exatamente como devem ser exibidas.

---

## 1. Why

Six complaints from real use of the installed app on iPhone, verified against the code and
against screenshots of the production build on a WebKit iPhone viewport (2026-09-23):

| Complaint | Root cause found |
|---|---|
| The screen wobbles while scrolling | The whole document scrolls and the tab bar is fixed to the window. Standalone iOS rubber-bands the document at both ends; `overscroll-behavior` on `body` does not stop it. |
| The page pans sideways in the PWA, not in Safari | Nothing in the layout is wider than the viewport. The likeliest cause is a leftover pinch or double-tap zoom, which standalone mode keeps and lets you pan. |
| The tab bar buttons do not fit | Emoji icons at 15px render differently per OS and cannot take the active colour; labels are 9px; the bar's bottom padding is 10px plus the safe-area inset, so in the PWA the icons float above the home indicator. |
| The app feels dead | The three surface greys sit one step apart, so cards read as one slab. The only motion is a 3px wave at the bottom of a mostly empty tube. Everything else is text in boxes. |
| The colours could be better | Same as above, plus a single fixed palette. |
| The fish are not nice | Thirteen blobs with a fan tail, drawn from the six member accents. |

## 2. Goals and non-goals

### Goals

- The installed app feels native: nothing rubber-bands, nothing zooms, each page stays still,
  the tab bar sits on the home indicator.
- Six dark themes, chosen per device from Perfil, with real separation between background,
  card and chip. Fundo do mar is the default and the closest to today.
- One flat SVG icon set replaces every emoji that plays an icon role.
- Hoje reads as the hero screen: two tubes side by side, fish under the surface, water with
  visible life.
- Thirteen fish redrawn as flat, cel-shaded illustrations of the real species, behind the
  unchanged `<Fish>` interface, as a stopgap until Leo draws them in Rive.

### Non-goals

- Rive, a light theme, syncing the theme between devices, new screens or flows, any change to
  registers, rankings, streaks, celebrations, sync or RLS.

### Success criteria

1. On both installed iPhones: no rubber-band at the top or bottom of any tab, no sideways
   pan, no zoom on pinch, double-tap or input focus, tab bar flush with the home indicator.
2. Every theme passes the automated contrast audit (§7.6).
3. `npm run test:run` and `npm run e2e` pass; Lighthouse precached cold start stays under
   the §1 criterion 4 mark of the main spec.
4. Leo prefers the new Hoje to the old one on his own phone.

## 3. Decision log

| Topic | Decision | Rationale |
|---|---|---|
| Scroll model | A fixed frame the height of the screen; each screen scrolls inside it | The only reliable way to stop iOS document rubber-band in standalone mode; also clips any horizontal overflow |
| Zoom | `maximum-scale=1, user-scalable=no` in the viewport meta, `touch-action: manipulation` on the page, inputs at 16px or larger | Installed home-screen apps honour the meta; Safari in the browser ignores it, which is fine. Accepted WCAG 1.4.4 trade-off for a two-person app whose type sizes are fixed by the spec |
| Tab bar | SVG icons at 24px, 11px labels, the floating round plus kept | Chosen on the mockup canvas over an inline square plus |
| Themes | Six, as token sets under `data-theme` on `<html>`, per device in `localStorage`, no database column | Leo asked for a theme option explicitly. This is the leanest form: no sync, no schema, no new screen; a section in Perfil |
| Default theme | Fundo do mar | Continuity with today's look on first open after the update |
| Breu | Soft black `#0D0F12`, not `#000000` | Pure black was judged too much on the canvas |
| Theme picker | Six miniature tiles in a 3×2 grid under "Cor" in Perfil | A preview is what a theme is; a colour swatch would not show the card contrast |
| Emoji | Replaced wherever they play an icon role; kept inside celebratory copy | Icons must take the active colour and render the same on every OS; copy emoji are text |
| Hoje hero | Two tubes side by side inside the card; scroll strip returns only with a third member | Two people is the product; the strip was solving a problem the group does not have |
| Fish style | Flat cel-shaded illustrations of the real species: real silhouette, 3 tones per colour, scale rows, fin rays, eye and mouth. The level of the first realistic betta sample, not the naturalist push | Leo: "keep that, later I draw them and make them with Rive" |
| Fish colours | Per-species illustration palette as constants in each art file | A real betta is red and blue whatever the theme. The one documented exception to the tokens-only rule |
| Tambaqui | Replaces Peixe-anjo as the 100-day streak fish | Leo's request. `fish_variant` is free text and nobody can hold a 100-day streak yet, so no migration |
| Rive | Leo's later project; `<Fish variant state size>` stays the swap point | Unchanged from the main spec §2 |
| Type sizes | Screen titles 20→24px, section labels 9→10px, tab labels 11px | Legibility on the phone; 9px labels were the smallest text on screen |
| Fish availability | All thirteen selectable from the start (`ALL_FISH_AVAILABLE`) | Leo's call after seeing the redrawn set (2026-09-24); the unlock conditions stay as the streak-milestone source and the re-gating switch |
| Bubbles | Removed | Leo's call after seeing them (2026-09-24) |

## 4. App frame

### 4.1 Layout

```
#root                       height: 100dvh; flex column; padding-top: env(safe-area-inset-top)
├── <main> scroll region    flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
│                           overscroll-behavior: contain; -webkit-overflow-scrolling: touch
│   └── the active screen (header scrolls with its content — no sticky headers)
├── update bar              a static row above the tab bar, only while an update waits
└── tab bar                 56px + env(safe-area-inset-bottom); never position: fixed
```

- `html, body { height: 100%; overflow: hidden; }`. The document never scrolls.
- `AppShell` owns the scroll region for the four tabs. The auth and onboarding routes render
  inside an identical scroll region from their own layout, so the login screen behaves the same.
- The register sheet and the celebration screens stay `position: fixed` overlays inside the
  430px column; they already scroll their own content.
- The update bar stops being a floating box at `bottom-28`; it is a row between the scroll
  region and the tab bar, so the page no longer needs to reserve space for it.
- `#root` keeps `max-width: 430px; margin: 0 auto` for the desktop column.
- The wave and fish pause logic (`useWavePause`) keeps working: `IntersectionObserver`
  observes against the viewport, which is unchanged.

### 4.2 Zoom

- `index.html` viewport: `width=device-width, initial-scale=1, maximum-scale=1,
  user-scalable=no, viewport-fit=cover`.
- `html { touch-action: manipulation; }` in `globals.css` (today only buttons have it).
- Every `<input>` and `<textarea>` renders at 16px or larger. Today they inherit 16px; the rule
  is made explicit on `Field` and on the note and time inputs so it cannot regress.

### 4.3 Safe areas

- Top: `#root` padding, as today.
- Bottom: the tab bar's `padding-bottom: env(safe-area-inset-bottom)` with no extra 10px.
- The register sheet keeps its own bottom inset.

## 5. Tab bar

```
┌──────────────────────────────────────────────────────┐
│  [drop]   [trophy]     ( + )     [calendar]  [fish]  │   56px of content
│   Hoje    Ranking               Histórico   Perfil   │
│                                                      │   + safe-area-inset-bottom
└──────────────────────────────────────────────────────┘
```

- Five equal slots. Each tab is a `NavLink` with a 24px icon over an 11px / 700 label,
  `min-height: 56px`, `aria-current="page"` when active.
- Active: icon filled and label in `--water`. Inactive: outline icon and label in `--ink-2`.
  Press state: `--line` background for 100ms, as today.
- The plus: a 52px circle, `--water` fill, 3px `--water-edge` bottom edge, `--ink-on-water`
  plus glyph at 26px, raised 14px above the bar's top border, `aria-label` "Registrar água".
- `TabRoute.icon` changes from `string` to a component `(props: { active: boolean }) =>
  ReactNode`. The route table stays the single source of truth for both routing and the bar.

## 6. Icon set

One file, `src/ui/icons.tsx`, stroke 2, round caps and joins, 24×24 viewBox, `aria-hidden`.
Every icon takes `currentColor` so it follows the text colour of its parent.

| Icon | Replaces | Where |
|---|---|---|
| `Drop` | 💧 | tab Hoje (filled when active), register row tile (filled, 18px, `--water`) |
| `Trophy` | 🏆 | tab Ranking |
| `Calendar` | 📅 | tab Histórico |
| `FishIcon` | 🐠 | tab Perfil |
| `Plus` | text "+" | the register button |
| `Flame` | 🔥 in the streak chip | streak chip, 14px, `--streak` |
| `Camera`, `Note`, `Clock` | 📷 📝 🕐 | the three optional chips in the register sheet |
| `Check` | new | the selected theme tile |
| `Close` | ✕ | remove-photo control in the register sheet |

Kept as text: "Nenhum registro hoje. Bora beber água. 💧", "Ela venceu 🏆", "Você assumiu a
liderança 🏆", "🔥 30 dias seguidos!" (celebration copy), the keypad's ⌫, the steppers' ‹ ›.
The streak chip string drops its emoji: "12 dias" next to the flame icon.

## 7. Themes

### 7.1 Mechanism

- `tokens.css` keeps `@theme` with the Fundo do mar values as the defaults on `:root`.
- Each other theme is a block `html[data-theme="<id>"] { --color-bg: …; … }` overriding the
  same custom properties. Tailwind v4 utilities reference `var(--color-*)`, so no component
  changes for theming.
- The choice lives in `localStorage` under `gymfishes:theme`. Values are the ids below. A
  missing or unknown value means Fundo do mar.
- `index.html` carries a two-line inline script before the bundle that reads the key and sets
  `data-theme`, so the first paint is already in the chosen theme.
- `useTheme()` in `src/features/theme/` exposes `{ theme, setTheme }`; `setTheme` writes the
  key, sets `data-theme`, and updates `<meta name="theme-color">` to the theme's `--bg`.
- `manifest.webmanifest` `background_color` and `theme_color` become Fundo do mar's `--bg`.
- Fish and the six member accents do not change with the theme. `--ok`, `--streak`,
  `--danger` and the accent swatches are the same in every theme.

### 7.2 Token sets

| Token | 1 Fundo do mar `fundo-do-mar` | 2 Tinta `tinta` | 3 Aquário `aquario` |
|---|---|---|---|
| `--bg` | `#0A1421` | `#0B0E12` | `#04171D` |
| `--surface` | `#162638` | `#1A2028` | `#0F2C36` |
| `--surface-2` | `#213850` | `#262E38` | `#17404D` |
| `--line` | `#32496A` | `#3B4552` | `#255A6B` |
| `--ink` | `#F2F7FB` | `#F4F6F8` | `#EEF8FA` |
| `--ink-2` | `#A3B9CB` | `#A0ADBA` | `#94BAC4` |
| `--ink-3` | `#6F879B` | `#6F7D8A` | `#628B96` |
| `--water` | `#1CB0F6` | `#22C4F5` | `#14B5EC` |
| `--water-edge` | `#1791CC` | `#1A9CC6` | `#0F91BE` |
| `--water-hi` | `#62CDFF` | `#7ADDFF` | `#66DBFF` |
| `--ink-on-water` | `#072536` | `#06232E` | `#052330` |

| Token | 4 Meia-noite `meia-noite` | 5 Areia `areia` | 6 Breu `breu` |
|---|---|---|---|
| `--bg` | `#0C0E1C` | `#141210` | `#0D0F12` |
| `--surface` | `#1A1D36` | `#23201C` | `#181B20` |
| `--surface-2` | `#262A4C` | `#302B26` | `#23272D` |
| `--line` | `#3B4070` | `#48413A` | `#373C44` |
| `--ink` | `#F3F3FB` | `#F6F1EA` | `#F3F5F7` |
| `--ink-2` | `#A6A9CC` | `#B5AA9C` | `#A2ABB3` |
| `--ink-3` | `#74789C` | `#83796C` | `#6F7880` |
| `--water` | `#2AB3F7` | `#1CB0F6` | `#1CB0F6` |
| `--water-edge` | `#1F8FCB` | `#1791CC` | `#1791CC` |
| `--water-hi` | `#7FD3FF` | `#62CDFF` | `#62CDFF` |
| `--ink-on-water` | `#071B33` | `#072536` | `#072536` |

Unchanged in every theme: `--ok #58CC02`, `--streak #FFC800`, `--danger #FF4B4B`, and the six
accent swatches of the main spec §8.

### 7.3 Display names

"Fundo do mar", "Tinta", "Aquário", "Meia-noite", "Areia", "Breu".

### 7.4 The picker in Perfil

A section "Tema" between "Cor" and "Minhas garrafas":

```
TEMA
┌──────────┐ ┌──────────┐ ┌──────────┐
│ ▢ card ✓ │ │ ▢ card   │ │ ▢ card   │    tile 104×64, 12px radius, 2px border
│  ▬ water │ │  ▬ water │ │  ▬ water │    (--water when selected, --line otherwise)
└──────────┘ └──────────┘ └──────────┘
Fundo do mar    Tinta       Aquário        12px / 700, --ink when selected, --ink-2 otherwise
┌──────────┐ ┌──────────┐ ┌──────────┐
│          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘
Meia-noite      Areia        Breu
```

Each tile is a `<button aria-pressed>` painting that theme's `--bg`, a rounded `--surface`
block with a `--line` border, and a `--water` bar, from the theme's own values, not the
current theme's. Tapping applies immediately; there is no save button. Touch target is the
whole tile plus label, above 44px.

### 7.5 What does not follow the theme

The fish (species palettes, §9.2) and the six member accents. Everything else, celebration
shapes included, already reads tokens and follows the theme for free.

### 7.6 Contrast audit

`src/lib/contrast.ts` exports `contrastRatio(a: string, b: string): number` (WCAG 2.x relative
luminance) and `lightnessDelta(a: string, b: string): number` (difference in CIE L*), plus the
theme table. Text uses the WCAG ratio. Surfaces use L*, because at these dark values the WCAG
ratio is dominated by its 0.05 offset and cannot tell a visible card from an invisible one.
A unit test asserts for every theme:

| Pair | Minimum |
|---|---|
| `--ink` on `--surface` | ratio 7.0 |
| `--ink-2` on `--surface` and on `--bg` | ratio 4.5 |
| `--ink-3` on `--surface` | ratio 3.0 (labels only, 10px / 800, as accepted in the main spec) |
| `--water` on `--bg` and on `--surface` | ratio 3.0 |
| `--ink-on-water` on `--water` | ratio 4.5 |
| `--surface` against `--bg` | L* difference 5 (a visible card) |
| `--surface-2` against `--surface` | L* difference 4 (a visible chip) |
| `--line` against `--surface` | L* difference 5 (a visible border) |

Any value tuned during implementation stays inside these bounds; the test is the guard.

## 8. Hoje

### 8.1 Header

"Hoje" at 24px / 800, the date at 13px / 500 `--ink-2` beneath it. On the right, the avatar:
a 44px circle, `--surface-2` fill, 2px border in the member's accent, the fish at 30px inside.
Tap → Perfil, as today.

### 8.2 Hero card

```
┌────────────────────────────────────────┐
│  ┌──────────┐      ┌──────────┐        │  card: --surface, 1px --line, 16px radius, 16px pad
│  │  ~~~~~~  │      │ ~~~~~~~~ │        │  tube: 158×220, --surface-2, 2px --line, 16px radius
│  │ 🐟  ○    │      │  🐟   ○  │        │  water: --water, wave crest --water-hi
│  │    ○     │      │ ○        │        │  fish: 56px, just under the surface
│  └──────────┘      └──────────┘        │
│      1,8 L             2,3 L           │  24px / 800
│      VOCÊ              ELA             │  10px / 800 / 1px tracking, member accent
│        Ela está 500 ml na frente       │  15px / 700, --water
└────────────────────────────────────────┘
```

- Two members: both tubes inside the card, centred, 16px apart, no scroll. Three or more:
  the horizontal strip of today returns, left-aligned.
- Tube scale rule unchanged: `max(3000, highestTotalToday)` ml.
- Fish width 56px (from 44). `fishBottomPx` keeps its contract with the new height.
- Wave amplitudes 4px back / 3px front (from 3 / 2); drift speeds unchanged.
- No bubbles: three rising discs per tube shipped in M7 and were removed the same day at
  Leo's request. The wave and the fish carry the motion.
- The splash on a new register, the count-up and the gap line are unchanged.

### 8.3 Registers card

The label "Registros de hoje · 4" at 10px. The streak chip: `Flame` icon plus "12 dias", 1px
`--streak` border, `--streak` text, 24px tall pill. Rows unchanged except the tile: `Drop`
icon at 18px in `--water` on a `--surface-2` 42px tile instead of the 💧 glyph.

### 8.4 Other tabs

Only the type-size changes (titles 24px, labels 10px) and the icon replacements (§6) touch
Ranking, Histórico and Perfil. Standings show the fish at 28px (from 22).

## 9. Fish

### 9.1 Style

Flat, cel-shaded illustrations of the real species, drawn in code and checked against
renders. For each fish: the true silhouette and proportions, three tones per colour (base,
shade, highlight) as flat shapes clipped to the body, a lighter belly, scale rows as small
arcs where the species shows scales, fin rays as thin lines, a thin outline in the darkest
tone, a real eye (white, iris, pupil, highlight) and a mouth. No gradients, no opacity.
Detail is tuned to read at 56px and to reward 160px.

Reference level: the first realistic betta sample on the mockup canvas. Not the naturalist
push with membranes and forked rays.

### 9.2 Species and palettes

| Id | pt-BR | Identity to draw | Starting palette (base / shade / light) |
|---|---|---|---|
| `guppy` | Guppy | slim body, huge orange spotted fan tail, small dorsal | body `#22B8F0 / #1793CC / #8ADCFF`, fins `#FF9600 / #D96E00 / #FFC27A` |
| `betta` | Betta | slim body, veil tail, tall dorsal, long anal fin, two ventral fins | body `#2B5FC7 / #173C8F / #5A93EE`, fins `#D8385A / #A5213F / #F27C93` |
| `goldfish` | Peixe-dourado | deep body, double flowing tail, round belly | `#FF9600 / #D96E00 / #FFD27A`, belly `#FFE9B8` |
| `neon` | Neon | tiny torpedo, silver, electric blue stripe, red lower rear half | body `#C9D6E2 / #8FA5B8`, stripe `#38C8FF`, red `#E5323F` |
| `pufferfish` | Baiacu | round, tiny fins, big eyes, dark spots, pale belly | `#C9D45A / #8E9A2E / #E9F08E`, spots `#3B4322`, belly `#F2F0D8` |
| `clownfish` | Peixe-palhaço | orange, three white bands edged black, rounded fins | `#FF7A1A / #D95A00 / #FFA25C`, bands `#F7F7F2`, edges `#1C1C1C` |
| `tambaqui` | Tambaqui | deep body, small head, dark lower half, olive-silver back, forked tail | back `#8DA6B3 / #5F7683`, lower `#34474F / #1F2C33`, fins `#3E5663` |
| `octopus` | Polvo | bulbous mantle, eight curling arms with suckers, big eye | `#B04A6A / #7E2F4A / #D97A96`, suckers `#F0C9D6` |
| `seahorse` | Cavalo-marinho | upright S body, coronet, snout, curled tail, ridged segments | `#F2B134 / #C4861B / #FFD97A` |
| `turtle` | Tartaruga | oval shell with plates, flippers, beaked head | shell `#4E8F3A / #2F6423 / #8AC46F`, skin `#8FA066 / #5F6E42` |
| `dolphin` | Golfinho | sleek, curved dorsal, beak, light belly, smile | `#6F8FA8 / #486A85 / #A9C1D3`, belly `#E4ECF2` |
| `shark` | Tubarão | torpedo, tall dorsal, crescent tail, gill slits, white belly | `#7C8B99 / #55636F / #A7B4C0`, belly `#F0F3F5` |
| `whale` | Baleia | blue whale, long flat body, tiny dorsal far back, throat grooves | `#4C7DA6 / #2F5A7E / #7EA8CC`, belly `#D6E3EE` |

This is the starting palette, not a snapshot of what shipped: tambaqui's tones were widened
during implementation (a lighter back tone, plus separate low-body, deep-belly, fin and
pectoral tones) so it reads against the tube background, and every fish's outline uses its
own darkest tone rather than a shared black. The values as drawn live in each
`svg/<id>.ts` file; the contrast/lightness audit (§7.6) only governs theme tokens, not fish
palettes, so nothing here is machine-checked — a look at the contact sheet (§9.2 helper
`npm run fish:sheet`) is the verification.

All thirteen face right in a shared 160×100 box, the same 1.6:1 as the old 64×40 so every
size in §9.4 and the tube geometry hold; the seahorse stands upright inside it. The
catalog order, unlock conditions and starter set are unchanged except `angelfish` → `tambaqui`
in `FISH_IDS`, `UNLOCKS`, `STRINGS.peixes.nomes` and the art registry. `fishOf('angelfish')`
falls back to guppy through the existing unknown-id rule.

### 9.3 Art model

`FishArt` grows from five fixed layers to an ordered list:

```ts
type Layer = { d: string; fill: string; stroke?: string; strokeWidth?: number; clip?: boolean }
type Eye = { cx: number; cy: number; r: number }
type FishArt = {
  body: string          // the silhouette path, also the clip path for `clip: true` layers
  tailPivot: readonly [number, number]
  tail: readonly Layer[]    // rotated by the idle wag
  layers: readonly Layer[]  // fins behind the body, the body, shading, scales, head, mouth
  eyes: readonly Eye[]
}
```

- `svg/helpers.ts` holds the pure builders shared by the art files: `part` (a filled shape
  with its outline), `shade` (a flat tone clipped to the body), `stroke` (a line), `rays`
  (fin rays from an origin), `scaleRows` (rows of scale arcs), `dots` (spots and suckers) and
  `tone` (a token as a CSS variable, for art that draws from tokens). Art files stay data
  plus helper calls, one file per fish, each under 200 lines.
- `Fish.tsx` renders `<defs><clipPath>` from `body`, then `tail` inside the wag group, then
  `layers`, then the eyes. `locked` renders every layer with `fill: var(--color-ink-3)` and no
  stroke, which keeps the one-colour silhouette.
- `idle` keeps the tail wag and the bob; the celebration lift is unchanged.

### 9.4 Sizes

| Placement | Today | M7 |
|---|---|---|
| Hoje tube | 44 | 56 |
| Hoje header avatar | 36 | 30 inside a 44px ring |
| Standings row | 22 | 28 |
| Perfil "Seu peixe" | 72 | 120 |
| Gallery tile | 56 in a 4-column grid | 140 in a 2-column grid; name and condition under it |
| Onboarding picker | reuses the gallery grid | same |
| Unlock celebration | 160 | 200 |

### 9.5 Rive later

Leo will draw the fish in Rive. `<Fish variant state size>` is the swap point; nothing outside
`src/features/fish/` may depend on how a fish is drawn. When the Rive files land, the art
files above are deleted, not kept as a fallback.

## 10. Strings

Added or changed in `src/lib/strings.ts`:

- `perfil.tema`: "Tema"
- `tema.nomes`: "Fundo do mar", "Tinta", "Aquário", "Meia-noite", "Areia", "Breu"
- `hoje.streak`: `(dias) => "${dias} dia" | "${dias} dias"` (emoji removed; the flame is an icon)
- `registrar.foto` / `nota` / `agora`: "foto", "nota", "agora" (emoji removed; icons render beside)
- `peixes.nomes.tambaqui`: "Tambaqui" (replaces `angelfish`: "Peixe-anjo")

Unchanged: tab labels, the empty state with its 💧, all celebration copy.

## 11. Testing

Unit and component (Vitest + RTL, behaviour through roles and pt-BR text):

- `contrast.test.ts`: every pair in §7.6 for every theme.
- `theme.test.ts`: default with nothing stored; unknown value falls back; `setTheme` persists,
  sets `data-theme` and the theme-color meta.
- `TabBar.test.tsx`: four links named "Hoje", "Ranking", "Histórico", "Perfil", the button
  "Registrar água", `aria-current` on the active tab, no emoji text in the bar.
- `Fish.test.tsx`: all 13 ids render in `idle`, `still` and `locked`; `locked` has no stroke.
- `ProgressStrip.test.tsx`: two members render side by side with no scroll container; three
  render the strip.
- `Perfil` theme section: six pressable tiles, tapping one flips `aria-pressed`.
- `FishGallery`: "Tambaqui" appears with "Sequência de 100 dias"; "Peixe-anjo" does not.

End to end: the existing smoke against the production build, unchanged.

Manual, on both installed iPhones after deploy:

1. Scroll each tab to both ends: no rubber-band, header and tab bar never move.
2. Pinch and double-tap on Hoje and on the register sheet: no zoom.
3. Focus the note field and the login e-mail: no zoom.
4. Focus the note field in the register sheet and the name field in Perfil, then dismiss the
   keyboard: the tab bar returns flush to the home indicator and the page is not left shifted.
5. Try to pan sideways on every tab: nothing moves.
6. Tab bar flush with the home indicator; the plus centred on the border.
7. Switch through all six themes in Perfil; force-quit and reopen: the choice survives and
   the status bar colour matches.
8. Both fish visible in the tubes; the gallery shows 13 with Tambaqui at 100 dias.

## 12. Files

New: `src/ui/icons.tsx`, `src/app/AuthFrame.tsx`, `src/features/theme/themes.ts`,
`src/features/theme/theme.ts`, `src/features/theme/useTheme.ts`,
`src/features/theme/ThemePicker.tsx`, `src/lib/contrast.ts`, `src/features/fish/svg/helpers.ts`,
`src/features/fish/svg/tambaqui.ts`, `scripts/fish-sheet.mjs`, `scripts/fish-sheet.entry.tsx`.

Changed: `index.html`, `public/manifest.webmanifest`, `src/styles/tokens.css`,
`src/styles/globals.css`, `src/app/AppShell.tsx`, `src/app/TabBar.tsx`, `src/app/routes.tsx`,
`src/main.tsx` (auth layout scroll region), `src/features/pwa/UpdatePrompt.tsx`,
`src/lib/strings.ts`, `src/ui/Field.tsx`, `src/screens/hoje/*` (Hoje, ProgressStrip,
MemberTube, WaveSurface, EntryRow, RegistersCard), `src/screens/registrar/OptionalChips.tsx`,
`src/screens/ranking/Standings.tsx`,
`src/screens/perfil/Perfil.tsx`, `src/screens/perfil/FishGallery.tsx`,
`src/features/fish/{Fish,FishGrid}.tsx`, `src/features/fish/catalog.ts`,
`src/features/fish/svg/*.ts` (12 redrawn, `angelfish.ts` deleted),
`src/features/celebrations/CelebrationScreen.tsx`, the tests beside each.

Docs: this spec; main spec §5.1, §5.5, §6, §8, §9, §16 aligned in the final task; roadmap M7
row; README theme line.

## 13. Sequencing

Four clusters, each leaving the app shippable:

1. Frame and zoom (§4), tab bar and icons (§5, §6).
2. Themes, picker, contrast audit (§7); type-size changes.
3. Hoje hero (§8).
4. Fish (§9), largest and last, so everything else ships regardless of how long the
   drawings take.

## 14. Out of scope, recorded

Rive; a light theme; theme sync between devices; sticky headers; haptics; any change to the
register sheet beyond its chip icons and input sizes; redrawing the app icon.
