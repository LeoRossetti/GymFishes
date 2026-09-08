import { beforeEach, describe, expect, it } from 'vitest'
import type { FishId } from '@/features/fish/catalog'
import { SEEN_UNLOCKS_KEY, loadSeenUnlocks, saveSeenUnlocks } from './seenUnlocks'

describe('seenUnlocks', () => {
  beforeEach(() => localStorage.clear())

  it('is null on a device that never recorded any', () => {
    expect(loadSeenUnlocks()).toBeNull()
  })

  it('round-trips a set', () => {
    saveSeenUnlocks(new Set<FishId>(['guppy', 'pufferfish']))
    expect(loadSeenUnlocks()).toEqual(new Set(['guppy', 'pufferfish']))
    expect(localStorage.getItem(SEEN_UNLOCKS_KEY)).toBe('["guppy","pufferfish"]')
  })

  it('drops values it does not recognise', () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, '["guppy","dragon",42]')
    expect(loadSeenUnlocks()).toEqual(new Set(['guppy']))
  })

  it('treats unreadable storage as never recorded', () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, '{not json')
    expect(loadSeenUnlocks()).toBeNull()
  })
})
