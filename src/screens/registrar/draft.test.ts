import { describe, expect, it } from 'vitest'
import { draftFromEntry, draftItems, draftReducer, emptyDraft, qtyOf } from './draft'
import type { Entry } from '@/features/entries/cache'

const now = new Date('2026-09-01T12:00:00Z')
const azul = { name: 'Garrafa azul', volume_ml: 1500 }

describe('draftReducer', () => {
  it('increments a bottle on tap and decrements to removal', () => {
    let d = draftReducer(emptyDraft(now), { type: 'tapBottle', ...azul })
    d = draftReducer(d, { type: 'tapBottle', ...azul })
    expect(qtyOf(d, azul.name, azul.volume_ml)).toBe(2)
    d = draftReducer(d, { type: 'decBottle', ...azul })
    d = draftReducer(d, { type: 'decBottle', ...azul })
    expect(qtyOf(d, azul.name, azul.volume_ml)).toBe(0)
    expect(d.bottles).toEqual([])
  })
  it('pills add to the loose amount; keys edit it', () => {
    let d = draftReducer(emptyDraft(now), { type: 'pill', amount: 250 })
    d = draftReducer(d, { type: 'pill', amount: 250 })
    expect(d.loose).toBe(500)
    d = draftReducer(d, { type: 'key', key: 'back' })
    expect(d.loose).toBe(50)
    d = draftReducer(d, { type: 'key', key: '0' })
    expect(d.loose).toBe(500)
  })
  it('setDrankAt marks the time as edited', () => {
    const d = draftReducer(emptyDraft(now), { type: 'setDrankAt', at: new Date('2026-09-01T08:00:00Z') })
    expect(d.drankAtEdited).toBe(true)
  })
})

describe('draftItems', () => {
  it('builds the composition from bottles and loose', () => {
    let d = draftReducer(emptyDraft(now), { type: 'tapBottle', ...azul })
    d = draftReducer(d, { type: 'pill', amount: 300 })
    expect(draftItems(d)).toEqual([
      { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 1 },
      { kind: 'loose', amount_ml: 300 },
    ])
  })
})

describe('draftFromEntry', () => {
  it('seeds bottles, loose, note and time from a stored entry', () => {
    const entry = {
      composition: [
        { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 2 },
        { kind: 'loose', amount_ml: 300 },
      ],
      note: 'pós treino',
      drank_at: '2026-09-01T11:00:00+00:00',
    } as unknown as Entry
    const d = draftFromEntry(entry)
    expect(qtyOf(d, 'Garrafa azul', 1500)).toBe(2)
    expect(d.loose).toBe(300)
    expect(d.note).toBe('pós treino')
    expect(d.drankAtEdited).toBe(true)
  })
})
