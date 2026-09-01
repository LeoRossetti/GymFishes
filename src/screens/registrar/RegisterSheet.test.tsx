import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { RegisterSheet } from './RegisterSheet'
import type { Entry } from '@/features/entries/cache'

const insertMutate = vi.fn()
const updateMutate = vi.fn()
const onClose = vi.fn()

vi.mock('@/features/auth/AuthProvider', () => ({
  useSession: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}))
vi.mock('@/features/profile/useBootstrap', () => ({
  useBootstrap: () => ({ data: { profile: { id: 'u1' }, groupId: 'g1' } }),
}))
vi.mock('@/features/bottles/queries', () => ({
  useBottles: () => ({
    data: [
      {
        id: 'b1',
        profile_id: 'u1',
        name: 'Garrafa azul',
        volume_ml: 1500,
        emoji: '💙',
        archived_at: null,
        created_at: '2026-08-01T00:00:00Z',
      },
    ],
  }),
}))
vi.mock('@/features/bottles/mutations', () => ({
  createBottle: vi.fn(),
}))
vi.mock('@/features/entries/mutations', () => ({
  useInsertEntry: () => ({ mutate: insertMutate }),
  useUpdateEntry: () => ({ mutate: updateMutate }),
}))

describe('RegisterSheet', () => {
  beforeEach(() => {
    insertMutate.mockReset()
    updateMutate.mockReset()
    onClose.mockReset()
  })

  it('disables the CTA at zero', () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })

  it('tapping a bottle raises the running total; tapping again increments', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    const chip = screen.getByRole('button', { name: /Garrafa azul/ })
    await userEvent.click(chip)
    // '1,5 L' appears on the chip AND in the running total — assert on count, not uniqueness
    expect(await screen.findAllByText('1,5 L')).toHaveLength(2)
    await userEvent.click(chip)
    expect(await screen.findByText('3 L')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
  })

  it('pills add and the keypad edits the loose amount', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: '+250' }))
    await userEvent.click(screen.getByRole('button', { name: '+250' }))
    // '500 ml' shows both as the running total and as the loose-amount readout
    expect(await screen.findAllByText('500 ml')).toHaveLength(2)
  })

  it('submits an insert with the composition and closes optimistically', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Garrafa azul/ }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar 1,5 L/ }))
    expect(insertMutate).toHaveBeenCalledTimes(1)
    const input = insertMutate.mock.calls[0]?.[0]
    expect(input.totalMl).toBe(1500)
    expect(input.composition).toEqual([
      { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 1 },
    ])
    expect(onClose).toHaveBeenCalled()
  })

  it('includes a typed nota on submit', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /nota/ }))
    await userEvent.type(screen.getByRole('textbox'), 'pós treino')
    await userEvent.click(screen.getByRole('button', { name: '+100' }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar/ }))
    expect(insertMutate.mock.calls[0]?.[0].note).toBe('pós treino')
  })

  it('edit mode prefills and submits an update', async () => {
    const entry = {
      id: 'e1',
      profile_id: 'u1',
      group_id: 'g1',
      total_ml: 1800,
      composition: [
        { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 1 },
        { kind: 'loose', amount_ml: 300 },
      ],
      note: null,
      photo_path: null,
      thumb_path: null,
      drank_at: '2026-09-01T11:00:00+00:00',
      drank_on: '2026-09-01',
      created_at: '2026-09-01T11:00:00+00:00',
      updated_at: '2026-09-01T11:00:00+00:00',
      deleted_at: null,
    } as Entry
    renderWithProviders(<RegisterSheet entry={entry} onClose={onClose} />)
    expect(screen.getByText('1,8 L')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Salvar alterações/ }))
    expect(updateMutate).toHaveBeenCalledTimes(1)
    const call = updateMutate.mock.calls[0]?.[0]
    expect(call.id).toBe('e1')
    expect(call.patch.total_ml).toBe(1800)
  })
})
