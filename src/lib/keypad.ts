/** entries.total_ml is DB-checked to 1–20000; the keypad never builds past it. */
export const MAX_ML = 20000

export type KeypadKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | 'back'

export function pressKey(value: number, key: KeypadKey): number {
  if (key === 'back') return Math.floor(value / 10)
  const next = Number(`${value}${key}`)
  return next > MAX_ML ? value : next
}
