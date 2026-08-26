const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OUTSIDE_ALPHABET = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

export function generateInviteCode(random?: () => number): string {
  let code = ''
  if (random) {
    for (let i = 0; i < 6; i++) {
      code += ALPHABET[Math.floor(random() * ALPHABET.length)]
    }
    return code
  }
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  for (const n of buf) {
    code += ALPHABET[n % ALPHABET.length]
  }
  return code
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(OUTSIDE_ALPHABET, '').slice(0, 6)
}
