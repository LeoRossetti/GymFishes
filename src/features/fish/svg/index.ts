import type { FishId } from '../catalog'
import { betta } from './betta'
import { clownfish } from './clownfish'
import { dolphin } from './dolphin'
import { goldfish } from './goldfish'
import { guppy } from './guppy'
import { neon } from './neon'
import { octopus } from './octopus'
import { pufferfish } from './pufferfish'
import { seahorse } from './seahorse'
import { shark } from './shark'
import { tambaqui } from './tambaqui'
import type { FishArt } from './types'
import { turtle } from './turtle'
import { whale } from './whale'

export type { FishArt } from './types'

export const ART: Record<FishId, FishArt> = {
  guppy,
  betta,
  goldfish,
  neon,
  pufferfish,
  clownfish,
  tambaqui,
  octopus,
  seahorse,
  turtle,
  dolphin,
  shark,
  whale,
}
