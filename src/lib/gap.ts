import { formatVolume } from './format'
import { STRINGS } from './strings'

export function gapText(myMl: number, partnerMl: number, partnerName: string): string | null {
  if (myMl === 0 && partnerMl === 0) return null
  if (myMl === partnerMl) return STRINGS.hoje.empate
  const diff = formatVolume(Math.abs(myMl - partnerMl))
  return myMl > partnerMl
    ? STRINGS.hoje.voceNaFrente(diff)
    : STRINGS.hoje.parceiroNaFrente(partnerName, diff)
}
