import { useState } from 'react'
import { FISH_IDS, fishName, fishOf, UNLOCKS, type FishId } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'
import { FishGrid } from '@/features/fish/FishGrid'
import { availableFish, unlockFacts, unlockProgress } from '@/features/fish/unlocks'
import { useGroupData } from '@/features/group/useGroupData'
import { STRINGS } from '@/lib/strings'

type Props = { userId: string; current: string; busy: boolean; onSelect: (fish: FishId) => void }

/**
 * "Seu peixe" (spec §5.5): your fish large; tap to expand the gallery in place. Unlocks are derived here;
 * the fish you already wear is always yours, so a choice made while every fish was open never shows locked.
 */
export function FishGallery({ userId, current, busy, onSelect }: Props) {
  const { entries } = useGroupData()
  const [open, setOpen] = useState(false)
  const fish = fishOf(current)
  const unlocked = new Set([...availableFish(entries, userId), fish])
  const facts = unlockFacts(entries, userId)

  return (
    <section className="mb-3 rounded-card border border-line bg-surface p-4">
      <h2 className="mb-2 text-[10px] font-extrabold uppercase tracking-[1px] text-ink-3">{STRINGS.peixes.seuPeixe}</h2>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center gap-4 text-left"
      >
        <Fish variant={fish} size={120} state="idle" />
        <span className="text-[17px] font-extrabold">{fishName(fish)}</span>
        <span className="ml-auto text-[13px] font-bold text-water">
          {open ? STRINGS.peixes.fechar : STRINGS.peixes.trocarPeixe}
        </span>
      </button>
      {open ? (
        <div className="mt-3">
          <p className="mb-2 text-[12px] text-ink-2">{STRINGS.peixes.colecao(unlocked.size, FISH_IDS.length)}</p>
          <FishGrid
            variants={FISH_IDS}
            unlocked={unlocked}
            selected={fish}
            disabled={busy}
            onSelect={onSelect}
            progress={(id) => unlockProgress(UNLOCKS[id], facts)}
          />
        </div>
      ) : null}
    </section>
  )
}
