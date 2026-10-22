import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Entry } from '@/features/entries/cache'
import { FISH_IDS } from '@/features/fish/catalog'
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
    // 15:00Z is noon in Sao Paulo: never a morning register by accident
    drank_at: `${drank_on}T15:00:00+00:00`,
    drank_on,
    created_at: `${drank_on}T15:00:00+00:00`,
    updated_at: '',
    deleted_at: null,
  }) as Entry

/** Six consecutive days ending yesterday — one register today makes seven. */
const sixDays = () => Array.from({ length: 6 }, (_, i) => row(`d${i}`, 'u1', 500, addDays(today, -(i + 1))))

const stored = () => JSON.parse(localStorage.getItem(SEEN_UNLOCKS_KEY) ?? '[]') as string[]

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

  it('a first day of 3,5 L earns the mahi-mahi in one register: a full screen that can pick it now', async () => {
    renderTrigger([], [row('e1', 'u1', 3500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo peixe! Mahi-mahi' })
    expect(dialog).toHaveTextContent('Um dia com 3,5 L')
    expect(stored()).toEqual(['guppy', 'betta', 'goldfish', 'neon', 'mahimahi'])
    await userEvent.click(screen.getByRole('button', { name: 'Escolher agora' }))
    expect(updateProfile).toHaveBeenCalledWith('u1', { fish_variant: 'mahimahi' })
    // the screen fades out (C5), so it leaves the tree a moment later
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('the 7-day streak earns the tucunaré: the fish takes the full screen and the streak is dropped', async () => {
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByRole('dialog', { name: 'Novo peixe! Tucunaré' })).toBeInTheDocument()
    const toast = screen.getAllByRole('status').find((s) => s.textContent?.includes('🔥 7 dias seguidos!'))
    expect(toast).toBeUndefined()
    // the clownfish was earned on day 3 and is not new; the device now remembers both
    expect(screen.queryByText('Peixe-palhaço')).toBeNull()
    expect(stored()).toEqual(['guppy', 'betta', 'goldfish', 'neon', 'clownfish', 'tucunare'])
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('a register that unlocks a fish and takes the lead shows the trophy on the unlock screen, with no toast', async () => {
    const partner = row('e0', 'u2', 1000, today)
    renderTrigger([partner], [partner, row('e1', 'u1', 3500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo peixe! Mahi-mahi' })
    expect(within(dialog).getByRole('img', { name: 'Você está na frente' })).toBeInTheDocument()
    expect(screen.queryByText('Você assumiu a liderança 🏆')).toBeNull()
  })

  it('a device that stored every fish while all were open still celebrates the fish earned now', async () => {
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify(FISH_IDS))
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByRole('dialog', { name: 'Novo peixe! Tucunaré' })).toBeInTheDocument()
    expect(stored()).toEqual(['guppy', 'betta', 'goldfish', 'neon', 'clownfish', 'tucunare'])
  })

  it('a fish earned on another device is announced at the next register, in catalog order, and the outranked fish is dropped', async () => {
    // the clownfish was earned on day 3 but this device never celebrated it
    localStorage.setItem(SEEN_UNLOCKS_KEY, JSON.stringify(['guppy', 'betta', 'goldfish', 'neon']))
    const six = sixDays()
    renderTrigger(six, [...six, row('e7', 'u1', 500, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByRole('dialog', { name: 'Novo peixe! Peixe-palhaço' })).toBeInTheDocument()
    const toast = screen.getAllByRole('status').find((s) => s.textContent?.includes('Novo peixe! Tucunaré'))
    expect(toast).toBeUndefined()
    // the outranked fish is not spent: it is celebrated at the next register
    expect(stored()).not.toContain('tucunare')
    cleanup()
    const seven = [...six, row('e7', 'u1', 500, today)]
    renderTrigger(seven, [...seven, row('e8', 'u1', 100, today)])
    await userEvent.click(screen.getByRole('button', { name: 'go' }))
    expect(screen.getByRole('dialog', { name: 'Novo peixe! Tucunaré' })).toBeInTheDocument()
    expect(stored()).toContain('tucunare')
  })
})
