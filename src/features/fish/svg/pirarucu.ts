import { dots, part, rays, shade, stroke } from './helpers'
import type { FishArt, Layer } from './types'

const A = {
  body: '#56654A',
  back: '#3A4530',
  light: '#74835F',
  belly: '#A3A88E',
  red: '#D2363C',
  scale: '#2E3826',
  fin: '#3E2C27',
  finRay: '#25191A',
  cheek: '#D3CCBD',
  ring: '#C8B47A',
  line: '#191C14',
}

/** Traced from two photos: about 4:1, a small flat head with an upturned mouth, a long straight body, the dorsal and anal set far back, mirrored, around a rounded tail. */
const BODY = 'M26 42 C40 38 56 35 74 34.4 C96 33.8 112 35 124 37.2 C136 39.6 146 42.2 153.6 44.6 C154.6 44.9 155.4 45.2 155.6 45.6 L155.2 46.3 C156.4 45.6 157.6 44.8 158.4 44.8 C158.8 45.6 158.4 46.8 157.6 47.6 C155 49.6 152 51.8 147.6 54.6 C140 58.8 130 61.6 118 63.4 C100 65.6 86 65.8 74 65.4 C56 65 40 62 26 58 Z'

/**
 * The big scales, one arc each: red and heavy toward the tail, thin red through the middle, dark at the
 * front. The two edges step forward on the lower rows (the red runs further along the belly), so no row
 * ends on a straight line.
 */
const SCALES: Layer[] = (() => {
  const heavy: string[] = []
  const thin: string[] = []
  const dark: string[] = []
  const r = 2.9
  for (let row = 0; row < 6; row++) {
    const y = 37 + row * 5.4
    for (let x = 27.2 + (row % 2 ? 3.2 : 0); x <= 127; x += 6.4) {
      const arc = `M${Math.round(x * 10) / 10} ${Math.round((y - r) * 10) / 10} a${r} ${r} 0 0 0 0 ${r * 2}`
      if (x < 60 + row * 4) heavy.push(arc)
      else if (x < 88 + row * 5) thin.push(arc)
      else dark.push(arc)
    }
  }
  return [
    { d: dark.join(' '), fill: 'none', stroke: A.scale, strokeWidth: 0.7, clip: true },
    { d: thin.join(' '), fill: 'none', stroke: A.red, strokeWidth: 0.9, clip: true },
    { d: heavy.join(' '), fill: 'none', stroke: A.red, strokeWidth: 1.5, clip: true },
  ]
})()

/**
 * Pirarucu — the arapaima of the Amazon, one of the largest river fish there is. Olive front, big
 * scales, and toward the tail every scale edged in red (pira-urucu, the red fish); the dorsal and anal
 * fins far back, dark with red spots; a small head, the eye near the snout.
 */
export const pirarucu: FishArt = {
  body: BODY,
  tailPivot: [27, 50],
  tail: [
    part('M28 40.6 C21 35.6 13 33.4 7.4 37 C2.6 40.6 2.6 59.4 7.4 63 C13 66.6 21 64.4 28 59.4 Z', A.fin, A.line),
    rays([27, 50], [[8, 39], [5.6, 45], [5, 50], [5.6, 55], [8, 61]], A.finRay, 0.85),
    part('M8 37.6 C4.6 40.4 3.8 46 3.8 50 C3.8 54 4.6 59.6 8 62.4 C6.8 58 6.4 54 6.4 50 C6.4 46 6.8 42 8 37.6 Z', A.red),
    dots([[14, 40, 1.1], [18, 46, 1.2], [13, 52, 1.1], [19, 56, 1.1], [14, 60, 1]], A.red),
  ],
  layers: [
    // dorsal and anal: long, rounded, far back
    part('M60 35.4 C54 30.4 46 27.4 37.6 27.6 C31 27.8 26.6 31 25 36.4 L24.6 44 Z', A.fin, A.line),
    dots([[48, 31, 1.2], [40, 30.4, 1.1], [33, 32.6, 1.1], [54, 34, 0.9], [44, 34.6, 1], [29.6, 37.6, 1]], A.red),
    part('M62 65.4 C56 70.4 47.6 73 39 72.6 C32 72.2 27.4 69.6 25 64 L24.6 56 Z', A.fin, A.line),
    dots([[50, 69, 1.2], [42, 69.6, 1.1], [34, 67.6, 1.1], [56, 66.4, 0.9], [46, 65.6, 1], [30, 63, 1]], A.red),
    part('M86 65.8 C83 69 80 71 75.6 72 C74.4 72.2 74.2 71 75 70.2 C77 68.6 78 67 78.4 65.4 Z', A.fin, A.line, 1.2),
    part(BODY, A.body, A.line),
    // body: darker back, highlight, pale lower front, the dark rear half
    shade('M20 0 L160 0 L160 40 C140 39.6 118 39.4 96 40 C70 40.6 44 42 20 44.6 Z', A.back),
    shade('M64 66 C82 63.6 104 61.4 124 59.6 C138 58.4 150 57 160 55.6 L160 92 L64 92 Z', A.belly),
    // big scales: dark at the front, red-edged from the middle back, reddest at the tail
    ...SCALES,
    // head: olive crown, pale gill cover and throat, the gill-cover edge
    shade('M129.8 49.4 C134 50.2 138 50.8 142 50.6 C148 50 154 47.8 160 45.4 L160 70 L133.4 70 C128.4 62 128.2 55 129.8 49.4 Z', A.cheek),
    part('M131 61 C126 64.6 120 68.6 112.6 71.4 C111 72 110.6 70.6 111.6 69.6 C115.6 66.4 119.6 63.6 122.6 61.4 Z', A.fin, A.line, 1.2),
    stroke('M134.4 38.6 C128.4 46 128 55 133.2 62.4', A.scale, 1.2),
    // the upturned mouth: the lower jaw out in front and up, the short gape slanting back; nostril, iris ring
    stroke('M155.2 46.3 C153.6 47.4 152.2 48.4 150.4 49.6', A.line, 1.1),
    part('M144.8 46.4 A2.8 2.8 0 1 0 150.4 46.4 A2.8 2.8 0 1 0 144.8 46.4 Z', A.ring),
  ],
  eyes: [{ cx: 147.6, cy: 46.4, r: 2.2 }],
}
