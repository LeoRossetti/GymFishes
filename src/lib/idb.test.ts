import { describe, expect, it } from 'vitest'
import { idbStorage, loadOutbox, saveOutbox } from './idb'

describe('idbStorage', () => {
  it('round-trips a string and returns null for missing keys', async () => {
    await idbStorage.setItem('k', 'valor')
    expect(await idbStorage.getItem('k')).toBe('valor')
    await idbStorage.removeItem('k')
    expect(await idbStorage.getItem('k')).toBeNull()
  })
})

describe('outbox persistence', () => {
  it('round-trips the queue and is undefined before the first save', async () => {
    expect(await loadOutbox()).toBeUndefined()
    const queue = [{ id: 'e1', type: 'insert', attempts: 0 }]
    await saveOutbox(queue)
    expect(await loadOutbox()).toEqual(queue)
  })
})
