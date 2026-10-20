import { expect, it } from 'vitest'
import { shouldCloseSheet } from './sheetGesture'

it('closes on a long drag or a fast flick, not on a slow short drag', () => {
  expect(shouldCloseSheet(81, 0)).toBe(true)
  expect(shouldCloseSheet(40, 600)).toBe(true)
  expect(shouldCloseSheet(40, 100)).toBe(false)
})
