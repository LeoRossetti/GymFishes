import { STRINGS } from '@/lib/strings'
import { Segmented } from '@/ui/Segmented'
import type { TubeStyle } from './tubeStyle'
import { useTubeStyle } from './useTubeStyle'

const OPTIONS: readonly { value: TubeStyle; label: string }[] = [
  { value: 'cenario', label: STRINGS.tubo.cenario },
  { value: 'agua', label: STRINGS.tubo.agua },
]

/** "Tubo" (spec M10 §3.7): the scene behind the water, or water only. Per device. */
export function TubeStylePicker() {
  const { style, setStyle } = useTubeStyle()
  return (
    <section className="mt-4">
      <h2 className="mb-2 text-[10px] font-extrabold uppercase tracking-[1px] text-ink-3">{STRINGS.tubo.titulo}</h2>
      <Segmented options={OPTIONS} value={style} onChange={setStyle} label={STRINGS.tubo.titulo} />
    </section>
  )
}
