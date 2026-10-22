import { STRINGS } from '@/lib/strings'
import type { Unlock } from './catalog'
import type { Progress } from './unlocks'

/** Whole litres, rounded down: 99 999 ml is "99", never a litre not yet drunk. */
const litres = (ml: number) => String(Math.floor(ml / 1000))

/** Litres with one decimal comma, rounded down: 3499 ml is "3,4". */
const litresTenths = (ml: number) => (Math.floor(ml / 100) / 10).toFixed(1).replace('.', ',')

/** "12 de 30" under a locked fish (spec §5.2): numbers only, the unit is in the condition above it. */
export function progressText(u: Unlock, { current, target }: Progress): string {
  const fmt = u.kind === 'volume' ? litres : u.kind === 'record' ? litresTenths : String
  return STRINGS.peixes.progressoDe(fmt(current), fmt(target))
}
