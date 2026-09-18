import type { FishId } from '../catalog'
import { angelfish } from './angelfish'
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
import { turtle } from './turtle'
import type { FishArt } from './types'
import { whale } from './whale'

export type { FishArt, Tone } from './types'

export const ART: Record<FishId, FishArt> = {
  guppy,
  betta,
  goldfish,
  neon,
  pufferfish,
  clownfish,
  angelfish,
  octopus,
  seahorse,
  turtle,
  dolphin,
  shark,
  whale,
}
