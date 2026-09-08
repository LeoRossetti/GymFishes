import { describe, expect, it } from 'vitest'
import type { Member } from './queries'
import { memberName, selfFirst } from './useGroupData'

const m = (id: string): Member => ({ id, display_name: id, fish_variant: 'guppy', accent: 'blue', joined_at: id })

describe('selfFirst', () => {
  it('moves me to the front and keeps the rest in order', () => {
    expect(selfFirst([m('a'), m('b'), m('me'), m('c')], 'me').map((x) => x.id)).toEqual(['me', 'a', 'b', 'c'])
  })

  it('leaves the list alone when I am not in it', () => {
    expect(selfFirst([m('a'), m('b')], 'me').map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('memberName', () => {
  it('calls me Você, others by display name, strangers Alguém', () => {
    const members = [m('me'), m('ana')]
    expect(memberName(members, 'me', 'me')).toBe('Você')
    expect(memberName(members, 'me', 'ana')).toBe('ana')
    expect(memberName(members, 'me', 'ghost')).toBe('Alguém')
  })
})
