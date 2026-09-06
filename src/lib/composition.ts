import { formatVolume } from './format'

export type BottleItem = { kind: 'bottle'; name: string; volume_ml: number; qty: number }
export type LooseItem = { kind: 'loose'; amount_ml: number }
export type CompositionItem = BottleItem | LooseItem

export function buildComposition(
  bottles: readonly { name: string; volume_ml: number; qty: number }[],
  looseMl: number,
): CompositionItem[] {
  const items: CompositionItem[] = bottles
    .filter((b) => b.qty > 0)
    .map((b) => ({ kind: 'bottle', name: b.name, volume_ml: b.volume_ml, qty: b.qty }))
  if (looseMl > 0) items.push({ kind: 'loose', amount_ml: looseMl })
  return items
}

export function totalMl(items: readonly CompositionItem[]): number {
  return items.reduce(
    (sum, i) => sum + (i.kind === 'bottle' ? i.volume_ml * i.qty : i.amount_ml),
    0,
  )
}

/** "1 × Garrafa azul + 300 ml" — the running-total subtitle. */
export function describeComposition(items: readonly CompositionItem[]): string {
  return items
    .map((i) => (i.kind === 'bottle' ? `${i.qty} × ${i.name}` : formatVolume(i.amount_ml)))
    .join(' + ')
}

/** ["1 × Garrafa azul 1,5 L", "+ 300 ml"] — expanded-row chips. */
export function compositionChips(items: readonly CompositionItem[]): string[] {
  return items.map((i) =>
    i.kind === 'bottle'
      ? `${i.qty} × ${i.name} ${formatVolume(i.volume_ml)}`
      : `+ ${formatVolume(i.amount_ml)}`,
  )
}

/** Defensive parse of the jsonb column. Malformed items are dropped. */
export function parseComposition(value: unknown): CompositionItem[] {
  if (!Array.isArray(value)) return []
  const items: CompositionItem[] = []
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) continue
    const item = raw as Record<string, unknown>
    if (
      item.kind === 'bottle' &&
      typeof item.name === 'string' &&
      typeof item.volume_ml === 'number' &&
      typeof item.qty === 'number'
    ) {
      items.push({ kind: 'bottle', name: item.name, volume_ml: item.volume_ml, qty: item.qty })
    } else if (item.kind === 'loose' && typeof item.amount_ml === 'number') {
      items.push({ kind: 'loose', amount_ml: item.amount_ml })
    }
  }
  return items
}
