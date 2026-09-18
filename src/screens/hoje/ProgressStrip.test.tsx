import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Entry } from '@/features/entries/cache'
import type { Member } from '@/features/group/queries'
import { dayKey } from '@/lib/dates'
import { ProgressStrip } from './ProgressStrip'

const inline = vi.hoisted(() => ({ value: null as string | null }))
vi.mock('@/features/celebrations/CelebrationProvider', () => ({
  useCelebrations: () => ({ celebrate: vi.fn(), inline: inline.value }),
}))

const members: Member[] = [
  { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
  { id: 'u2', display_name: 'Ana', fish_variant: 'betta', accent: 'pink', joined_at: '2' },
]
const today = dayKey(new Date())
const row = (id: string, profile_id: string, total_ml: number) =>
  ({
    id,
    profile_id,
    group_id: 'g1',
    total_ml,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: `${today}T15:00:00+00:00`,
    drank_on: today,
    created_at: `${today}T15:00:00+00:00`,
    updated_at: '',
    deleted_at: null,
  }) as Entry
const entries = [row('e1', 'u1', 1800), row('e2', 'u2', 2300)]

describe('ProgressStrip', () => {
  it('shows the gap line when nothing is being celebrated', () => {
    inline.value = null
    render(<ProgressStrip userId="u1" members={members} entries={entries} />)
    expect(screen.getByText('Ana está 500 ml na frente')).toBeInTheDocument()
  })

  it('replaces the gap line with the inline celebration while it shows', () => {
    inline.value = '2 L hoje'
    render(<ProgressStrip userId="u1" members={members} entries={entries} />)
    expect(screen.getByText('2 L hoje')).toBeInTheDocument()
    expect(screen.queryByText('Ana está 500 ml na frente')).toBeNull()
  })
})
