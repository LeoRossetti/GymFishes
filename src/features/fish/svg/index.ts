import type { FishId } from '../catalog'
import { barracuda } from './barracuda'
import { betta } from './betta'
import { clownfish } from './clownfish'
import { dourado } from './dourado'
import { goldfish } from './goldfish'
import { grouper } from './grouper'
import { guppy } from './guppy'
import { mahimahi } from './mahimahi'
import { neon } from './neon'
import { pintado } from './pintado'
import { pirarucu } from './pirarucu'
import { pufferfish } from './pufferfish'
import { sailfish } from './sailfish'
import { shark } from './shark'
import { tambaqui } from './tambaqui'
import { tucunare } from './tucunare'
import { tuna } from './tuna'
import type { FishArt } from './types'
import { whale } from './whale'

export type { FishArt } from './types'

export const ART: Record<FishId, FishArt> = {
  guppy,
  betta,
  goldfish,
  neon,
  clownfish,
  pufferfish,
  tucunare,
  tambaqui,
  dourado,
  barracuda,
  mahimahi,
  grouper,
  pintado,
  pirarucu,
  tuna,
  sailfish,
  shark,
  whale,
}
