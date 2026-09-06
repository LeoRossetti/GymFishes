import type { Entry } from '@/features/entries/cache'
import { buildComposition, parseComposition, type CompositionItem } from '@/lib/composition'
import { MAX_ML, pressKey, type KeypadKey } from '@/lib/keypad'

export type DraftPhoto = { blob: Blob; thumb: Blob; previewUrl: string }

export type Draft = {
  bottles: { name: string; volume_ml: number; qty: number }[]
  loose: number
  note: string
  drankAt: Date
  drankAtEdited: boolean
  photo: DraftPhoto | null
  photoRemoved: boolean
}

export type DraftAction =
  | { type: 'tapBottle'; name: string; volume_ml: number }
  | { type: 'decBottle'; name: string; volume_ml: number }
  | { type: 'pill'; amount: number }
  | { type: 'key'; key: KeypadKey }
  | { type: 'setNote'; note: string }
  | { type: 'setDrankAt'; at: Date }
  | { type: 'setPhoto'; photo: DraftPhoto }
  | { type: 'clearPhoto' }

export function emptyDraft(now: Date): Draft {
  return {
    bottles: [],
    loose: 0,
    note: '',
    drankAt: now,
    drankAtEdited: false,
    photo: null,
    photoRemoved: false,
  }
}

export function draftFromEntry(entry: Entry): Draft {
  const items = parseComposition(entry.composition)
  return {
    bottles: items.flatMap((i) =>
      i.kind === 'bottle' ? [{ name: i.name, volume_ml: i.volume_ml, qty: i.qty }] : [],
    ),
    loose: items.reduce((sum, i) => (i.kind === 'loose' ? sum + i.amount_ml : sum), 0),
    note: entry.note ?? '',
    drankAt: new Date(entry.drank_at),
    drankAtEdited: true,
    photo: null,
    photoRemoved: false,
  }
}

export function qtyOf(d: Draft, name: string, volume_ml: number): number {
  return d.bottles.find((b) => b.name === name && b.volume_ml === volume_ml)?.qty ?? 0
}

function bumpBottle(d: Draft, name: string, volume_ml: number, delta: 1 | -1): Draft {
  const found = d.bottles.find((b) => b.name === name && b.volume_ml === volume_ml)
  const bottles = found
    ? d.bottles.flatMap((b) =>
        b === found ? (b.qty + delta > 0 ? [{ ...b, qty: b.qty + delta }] : []) : [b],
      )
    : delta === 1
      ? [...d.bottles, { name, volume_ml, qty: 1 }]
      : d.bottles
  return { ...d, bottles }
}

export function draftReducer(d: Draft, a: DraftAction): Draft {
  switch (a.type) {
    case 'tapBottle':
      return bumpBottle(d, a.name, a.volume_ml, 1)
    case 'decBottle':
      return bumpBottle(d, a.name, a.volume_ml, -1)
    case 'pill':
      return { ...d, loose: Math.min(d.loose + a.amount, MAX_ML) }
    case 'key':
      return { ...d, loose: pressKey(d.loose, a.key) }
    case 'setNote':
      return { ...d, note: a.note }
    case 'setDrankAt':
      return { ...d, drankAt: a.at, drankAtEdited: true }
    case 'setPhoto':
      return { ...d, photo: a.photo, photoRemoved: false }
    case 'clearPhoto':
      return { ...d, photo: null, photoRemoved: true }
  }
}

export function draftItems(d: Draft): CompositionItem[] {
  return buildComposition(d.bottles, d.loose)
}
