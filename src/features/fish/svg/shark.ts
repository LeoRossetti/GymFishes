import { part, shade, stroke } from './helpers'
import type { FishArt } from './types'

const G = {
  body: '#7A8692',
  back: '#5E6A76',
  belly: '#EEF1F3',
  fin: '#6E7A86',
  slit: '#46515C',
  ring: '#15191D',
  tooth: '#F6F3EC',
  line: '#161C22',
}

/** The outline, open at the tail stalk. Traced from two levelled side photos: about 5.5:1 (the forebody deepened a little, about 15%), a bluntly conical snout over a short lower jaw, the deepest point at the first dorsal, a narrow keeled peduncle. */
const EDGE = 'M24.87 50.09 C35.41 48.69 44.84 46.63 56 44.3 C68 41.4 80 37.8 94 36.3 C106 35.2 122 36.6 134 40.8 C144 44.2 151 47.6 155 49.8 C157.4 51.2 158.4 52.6 158 54 C157.4 55.4 155 56.2 151.6 56.7 C149.6 57 147.8 57.2 146.4 57.2 L145.4 56.9 C145.7 57.8 145.3 58.4 144.2 58.8 C138 61 132 63.2 124 64.6 C116 66.2 108 66.4 98 65.2 C84 63.8 70 62.6 58 60.6 C46.84 58.74 33.95 56.05 24.56 54.83'

/** The silhouette and clip: the edge closed by the round end of the tail stalk, which carries no outline so the stalk flows into the tail. */
const BODY = `${EDGE} C22.6 54.7 21.4 53.8 21.4 52.5 C21.4 51.2 22.6 50.3 24.87 50.09 Z`

/** The countershading edge: crisp under the eye and above the mouth, down over the gills to the pectoral, then ragged along the lower flank. */
const BELLY = 'M160 53.6 C156 54.4 152 54.8 148.4 54.4 C145 54 142.6 54.5 140.2 54 C137.6 53.5 135.6 54.2 133.2 53.7 L130.4 53.3 L127.2 53.8 L124.6 52.9 L121.8 53.5 L118.6 52.9 L116.6 53.5 L114.4 53.8 L112.6 55 L110.4 54.9 L108.6 56.4 L106.6 56.8 L104.6 58.4 L102.4 58.4 L100.4 59.2 L98.2 58.4 L96.4 59 L93.8 57.6 L92.8 59.2 L91.6 58.2 L88.6 57.6 L86.4 58.4 L84.2 57.4 L80.8 57.8 L78.6 56.8 L75.6 57.3 L71.8 56.9 L69.8 55.9 L68.6 55 L66.8 56.5 L63.8 56.1 L61.4 55.2 L58.2 55.5 L55.8 54.6 L52.4 54.8 L49.6 54 L45.6 54 L42.8 53.4 L38.4 53.4 L34.4 53 L29.4 53.3 C26.8 53.5 24.8 54.1 23 55.4 L23 72 L160 72 Z'

const GILLS = [0, 1, 2, 3, 4]
  .map((i) => {
    const x = 104.4 + i * 2.4
    return `M${x + 0.8} ${44.4 - i * 0.2} C${x + 0.2} ${49} ${x - 0.2} ${54} ${x - 0.7} ${60.4 - i * 0.9}`
  })
  .join(' ')

/** The mouth, just parted: the upper jaw arching back from the notch to the corner, a row of small teeth. */
const MOUTH = 'M146 56.9 C142.8 56 138.8 55.4 134.6 55.6 C138.4 56.3 142.4 57.3 145.4 58.1 Z'
const TEETH = 'M144 56.7 L143.4 57.7 L142.8 56.5 Z M141.8 56.3 L141.3 57.2 L140.8 56.1 Z M139.8 55.9 L139.4 56.7 L139 55.8 Z M137.9 55.7 L137.6 56.3 L137.3 55.7 Z'

/**
 * Tubarão — the great white shark. Slate-grey back over a white belly with a sharp, ragged edge, a
 * conical snout over the underslung mouth with a glimpse of teeth, the small black eye, five long gill
 * slits, the tall triangular first dorsal, the tiny second dorsal and anal, long sickle pectorals, the
 * keel on the tail stalk and a near-symmetric crescent tail, the upper lobe a little longer.
 */
export const shark: FishArt = {
  body: BODY,
  tailPivot: [25, 52.5],
  tail: [
    part('M33 51.6 C30 51.2 26.6 50.4 24.6 49.8 C18 43 10 35 4 28 C7.6 36 10.2 44 10.8 52.4 C10.2 60 8.4 66 6.6 70.6 C13.6 66 19.6 59.4 24.8 55.2 C27 54.6 30 54.2 33 53.8 Z', G.fin, G.line),
  ],
  layers: [
    // fins behind the body: the tall first dorsal, the tiny second dorsal and anal, the pelvic
    part('M96 42 L95 36.8 C92 31 86 25.5 79.6 22.4 C78.8 21.9 78.2 22.2 78.2 23 C79 29 78.6 35 75 39.6 L80 43 Z', G.fin, G.line),
    part('M48.4 48.4 L47.4 46.2 C46.4 45.2 45.4 43.8 44.4 42.8 C44 44.2 43.6 45.6 42.8 46.6 C42 47.1 41.2 47.4 40.2 47.6 L41.4 49.2 Z', G.fin, G.line, 1.2),
    part('M47 55.8 L45.8 57.8 C45 58.8 44.2 59.6 43.4 60.4 C42.8 59.4 42 58.8 40.8 58.2 C40 57.8 39.2 57.5 38.4 57.2 L39.6 55.4 Z', G.fin, G.line, 1.2),
    part('M70.4 60.6 L68.4 62.4 C65.8 63.8 62.6 65.2 59.2 66.2 C59.6 64.6 60 63 60.4 60.8 Z', G.fin, G.line, 1.2),
    part(BODY, G.body),
    stroke(EDGE, G.line, 1.6),
    // body: darker back, the white belly, the keel along the tail stalk
    shade('M0 0 L147 0 L147 45.6 C144 44.8 140 44.2 134 43 C120 40.2 106 39.2 92 39.6 C76 40.4 60 43.8 46 47.6 C36 50 28 51 18 51.6 L0 51.6 Z', G.back),
    shade(BELLY, G.belly),
    shade('M44 53 C36 52.4 30 52.2 24.4 52.5 C30 52.9 36 53.3 44 53 Z', G.slit),
    // head: the five gill slits, the sickle pectoral over their lower ends
    { ...stroke(GILLS, G.slit, 0.9), clip: true },
    part('M107.6 60 C105.4 66.4 95 72.6 78.4 74.6 C86 72.4 92.4 68.4 96.6 62.8 C100 60.6 104.4 59.4 107.6 60 Z', G.fin, G.line),
    // mouth, teeth, nostril slit, the dark eye ring
    part(MOUTH, G.line),
    { d: TEETH, fill: G.tooth },
    stroke('M150 54.7 L151.1 54.3', G.line, 1.1),
    part('M142.1 51 A2.3 2.3 0 1 0 146.7 51 A2.3 2.3 0 1 0 142.1 51 Z', G.ring),
  ],
  eyes: [{ cx: 144.4, cy: 51, r: 1.7 }],
}
