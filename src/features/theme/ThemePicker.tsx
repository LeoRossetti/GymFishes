import { STRINGS } from '@/lib/strings'
import { Check } from '@/ui/icons'
import { THEMES, THEME_IDS } from './themes'
import { useTheme } from './useTheme'

/**
 * "Tema" (spec M7 §7.4): six tiles, each a miniature of its own background, card and water,
 * drawn from that theme's values rather than the current tokens — the one place inline hex is
 * allowed, because the tile *is* a rendering of the token table. Tap applies at once.
 */
export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  return (
    <section aria-labelledby="tema-titulo" className="mt-4">
      <h2 id="tema-titulo" className="mb-2 text-[10px] font-extrabold uppercase tracking-[1px] text-ink-3">
        {STRINGS.tema.titulo}
      </h2>
      <div className="grid grid-cols-3 gap-2.5">
        {THEME_IDS.map((id) => {
          const t = THEMES[id]
          const on = id === theme
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setTheme(id)}
              className="flex flex-col items-center gap-1.5 active:opacity-80 transition-opacity duration-100"
            >
              <span
                data-preview="bg"
                className={`relative block h-16 w-full overflow-hidden rounded-control border-2 ${on ? 'border-water' : 'border-line'}`}
                style={{ backgroundColor: t.bg }}
              >
                <span
                  className="absolute inset-x-2.5 top-2.5 h-11 rounded-[8px] border"
                  style={{ background: t.surface, borderColor: t.line }}
                />
                <span className="absolute inset-x-[18px] bottom-3.5 h-3.5 rounded-[4px]" style={{ background: t.water }} />
                {on ? (
                  <span className="absolute top-1.5 right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-water text-ink-on-water">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className={`text-[12px] font-bold ${on ? 'text-ink' : 'text-ink-2'}`}>{STRINGS.tema.nomes[id]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
