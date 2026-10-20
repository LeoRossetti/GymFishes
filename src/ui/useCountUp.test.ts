import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { animate } from 'motion'
import { useCountUp } from './useCountUp'

vi.mock('motion', () => ({ animate: vi.fn(() => ({ stop: vi.fn() })) }))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(animate).mockClear()
})

it('a retarget mid-count starts from the number on screen, not the previous target', () => {
  const { rerender } = renderHook(({ v }) => useCountUp(v, 0), { initialProps: { v: 250 } })
  const first = vi.mocked(animate).mock.calls[0]
  expect(first?.[0]).toBe(0)
  expect(first?.[1]).toBe(250)
  const opts = first?.[2] as { onUpdate: (v: number) => void }
  act(() => opts.onUpdate(120))
  rerender({ v: 500 })
  const second = vi.mocked(animate).mock.calls[1]
  expect(second?.[0]).toBe(120)
  expect(second?.[1]).toBe(500)
})
