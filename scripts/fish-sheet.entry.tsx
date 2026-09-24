import { renderToStaticMarkup } from 'react-dom/server'
import { FISH_IDS, fishName, type FishId } from '@/features/fish/catalog'
import { Fish } from '@/features/fish/Fish'

const SIZES = [320, 160, 56] as const

/** One row per fish: celebration, gallery and tube sizes, then the locked silhouette. */
export function renderSheet(only: readonly string[]): string {
  const ids = only.length ? FISH_IDS.filter((id) => only.includes(id)) : FISH_IDS
  const rows = ids
    .map((id: FishId) => {
      const cells = SIZES.map((s) =>
        renderToStaticMarkup(<Fish variant={id} size={s} state="still" />, { identifierPrefix: `${id}-${s}-` }),
      ).join('')
      const locked = renderToStaticMarkup(<Fish variant={id} size={96} state="locked" />, {
        identifierPrefix: `${id}-locked-`,
      })
      return `<section><div class="row">${cells}${locked}</div><p>${fishName(id)}</p></section>`
    })
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--color-ink:#F2F7FB;--color-ink-2:#A3B9CB;--color-ink-3:#6F879B;--color-ink-on-water:#072536;--color-bg:#0A1421;
--color-accent-blue:#1CB0F6;--color-accent-green:#58CC02;--color-accent-yellow:#FFC800;--color-accent-orange:#FF9600;--color-accent-purple:#CE82FF;--color-accent-pink:#FF86D0}
body{margin:0;padding:24px;background:#213850;color:#F2F7FB;font:700 14px system-ui}
section{margin-bottom:28px}.row{display:flex;align-items:center;gap:32px}p{margin:6px 0 0}
.fish-locked path,.fish-locked circle{fill:var(--color-ink-3);stroke:none}
</style></head><body>${rows}</body></html>`
}
