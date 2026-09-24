import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry } from '@/features/entries/cache'
import { addDays, dayKey } from '@/lib/dates'
import { renderWithProviders } from '@/test/utils'
import { ToastProvider } from '@/ui/Toast'
import { CelebrationProvider, useCelebrations } from './CelebrationProvider'
import { SEEN_UNLOCKS_KEY } from './seenUnlocks'

const updateProfile = vi.fn()
vi.mock('@/features/profile/mutations', () => ({
  updateProfile: (...args: unknown[]) => updateProfile(...args),
}))
vi.mock('@/features/group/useGroupData', () => ({
  useGroupData: () => ({
    userId: 'u1',
    groupId: 'g1',
    members: [
      { id: 'u1', display_name: 'Leo', fish_variant: 'guppy', accent: 'blue', joined_at: '1' },
      { id: 'u2', display_name: 'Ana', fish_variant: 'guppy', accent: 'pink', joined_at: '2' },
    ],
    entries: [],
  }),
}))

const today = dayKey(new Date())
const row = (id: string, profile_id: string, total_ml: number, drank_on: string) =>
  ({
    id,
    profile_id,
    group_id: 'g1',
    total_ml,
    composition: [],
    note: null,
    photo_path: null,
    thumb_path: null,
    drank_at: `${drank_on}T15:00:00+00:00`,
    drank_on,
    created_at: `${drank_on}T15:00:00+00:00`,
    updated_at: '',
    deleted_at: null,
  }) as Entry

/** Six consecutive days ending yesterday — one register today makes seven. */
const sixDays = () => Array.from({ length: 6 }, (_, i) => row(`d${i}`, 'u1', 500, addDays(today, -(i + 1))))

function Trigger({ before, after }: { before: Entry[]; after: Entry[] }) {
  const { celebrate, inline } = useCelebrations()
  return (
    <>
      <button type="button" onClick={() => celebrate(before, after)}>
        go
      </button>
      <p data-testid="inline">{inline ?? ''}</p>
    </>
  )
}

function renderTrigger(before: Entry[], after: Entry[]) {
  return renderWithProviders(
    <ToastProvider>
      <CelebrationProvider>
        <Trigger before={before} after={after} />
      </CelebrationProvider>
    </ToastProvider>,
  )
}

describe('CelebrationProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    updateProfile.mockReset().mockResolvedValue(undefined)
  })

  it('shows the round litre inline when it is the only celebration', async () => {
    renderTrigger([], [row('e1', 'u1', 1000, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByTestId('inline')).toHaveTextContent('1 L hoje')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('toasts the lead and drops the outranked litre', async () => {
    const partner = row('e0', 'u2', 1000, today)
    renderTrigger([partner], [partner, row('e1', 'u1', 1200, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Você assumiu a liderança 🏆')
    expect(screen.getByTestId('inline')).toHaveTextContent('')
  })

  it('the 7-day streak takes the full screen; no fish is new because every fish is already available', async () => {
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.queryByRole('dialog', { name: /Novo peixe!/ })).toBeNull()
    expect(screen.getByRole('dialog', { name: '🔥 7 dias seguidos!' })).toBeInTheDocument()
    // no toast fired — the only status is the full-screen dialog's own announcement
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveTextContent('🔥 7 dias seguidos!')
    // this device now remembers the whole set, so a later re-gate never re-celebrates them
    expect(JSON.parse(localStorage.getItem(SEEN_UNLOCKS_KEY) ?? '[]')).toHaveLength(13)
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('a device that stored a partial seen set before the change is not shown the rest as new', async () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify(['guppy', 'betta', 'goldfish', 'neon', 'pufferfish']))
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.queryByRole('dialog', { name: /Novo peixe!/ })).toBeNull()
    expect(screen.getByRole('dialog', { name: '🔥 7 dias seguidos!' })).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })
})
