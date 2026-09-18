import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { ToastProvider } from '@/ui/Toast'
import { RegisterSheet } from './RegisterSheet'
import type { Entry } from '@/features/entries/cache'

const insertMutate = vi.fn()
const updateMutate = vi.fn()
const onClose = vi.fn()
const createBottleMock = vi.fn()

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
  createBottle: (...args: unknown[]) => createBottleMock(...args),
}))
vi.mock('@/features/entries/mutations', () => ({
  useEntryOps: () => ({ insert: insertMutate, update: updateMutate, remove: vi.fn(), retry: vi.fn() }),
}))
vi.mock('@/features/group/queries', () => ({ useMembers: () => ({ data: [] }) }))
vi.mock('@/features/entries/queries', () => ({ useEntries: () => ({ data: [] }) }))
const celebrate = vi.fn()
vi.mock('@/features/celebrations/CelebrationProvider', () => ({
  useCelebrations: () => ({ celebrate: (...args: unknown[]) => celebrate(...args), inline: null }),
}))

describe('RegisterSheet', () => {
  beforeEach(() => {
    insertMutate.mockReset()
    updateMutate.mockReset()
    onClose.mockReset()
    createBottleMock.mockReset()
    celebrate.mockReset()
  })

  it('disables the CTA at zero', () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })

  it('the dialog contains its own accessible dismiss; tapping it closes the sheet', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const closeButton = within(dialog).getByRole('button', { name: 'Fechar' })
    await userEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
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

  it('a fast double-tap on the CTA only inserts once', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Garrafa azul/ }))
    const cta = screen.getByRole('button', { name: /Registrar 1,5 L/ })
    fireEvent.click(cta)
    fireEvent.click(cta)
    expect(insertMutate).toHaveBeenCalledTimes(1)
  })

  it('includes a typed nota on submit', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /nota/ }))
    await userEvent.type(screen.getByRole('textbox'), 'pós treino')
    await userEvent.click(screen.getByRole('button', { name: '+100' }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar/ }))
    expect(insertMutate.mock.calls[0]?.[0].note).toBe('pós treino')
  })

  it('shows a live character counter under the nota field', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /nota/ }))
    expect(screen.getByText('0/140')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), 'pós treino')
    expect(screen.getByText('10/140')).toBeInTheDocument()
  })

  it('shows the cap line and disables the CTA once the total exceeds the maximum', async () => {
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    const chip = screen.getByRole('button', { name: /Garrafa azul/ })
    for (let i = 0; i < 14; i++) {
      fireEvent.click(chip)
    }
    expect(await screen.findByText('Máximo de 20 L por registro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrar/ })).toBeDisabled()
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
    const [target, patch] = updateMutate.mock.calls[0]!
    expect(target.id).toBe('e1')
    expect(patch.total_ml).toBe(1800)
  })

  it('removing an existing photo in edit mode clears the paths on save', async () => {
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
      photo_path: 'g1/u1/e1.jpg',
      thumb_path: 'g1/u1/e1_thumb.jpg',
      drank_at: '2026-09-01T11:00:00+00:00',
      drank_on: '2026-09-01',
      created_at: '2026-09-01T11:00:00+00:00',
      updated_at: '2026-09-01T11:00:00+00:00',
      deleted_at: null,
    } as Entry
    renderWithProviders(<RegisterSheet entry={entry} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remover foto' }))
    await userEvent.click(screen.getByRole('button', { name: /Salvar alterações/ }))
    expect(updateMutate).toHaveBeenCalledTimes(1)
    const patch = updateMutate.mock.calls[0]?.[1]
    expect(patch.photo_path).toBeNull()
    expect(patch.thumb_path).toBeNull()
  })

  it('hands the mirror before and after the insert to the celebrations', async () => {
    const inserted = {
      id: 'e9',
      profile_id: 'u1',
      group_id: 'g1',
      total_ml: 1500,
      composition: [],
      note: null,
      photo_path: null,
      thumb_path: null,
      drank_at: new Date().toISOString(),
      drank_on: '2026-09-08',
      created_at: new Date().toISOString(),
      updated_at: '',
      deleted_at: null,
    } as Entry
    insertMutate.mockReturnValue(inserted)
    renderWithProviders(<RegisterSheet entry={undefined} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Garrafa azul/ }))
    await userEvent.click(screen.getByRole('button', { name: /Registrar 1,5 L/ }))
    expect(celebrate).toHaveBeenCalledWith([], [inserted])
  })

  it('surfaces a toast and keeps the form open when creating a bottle fails', async () => {
    createBottleMock.mockRejectedValueOnce(new Error('boom'))
    renderWithProviders(
      <ToastProvider>
        <RegisterSheet entry={undefined} onClose={onClose} />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: '+ nova garrafa' }))
    await userEvent.type(screen.getByLabelText('Nome da garrafa'), 'Copo')
    await userEvent.type(screen.getByLabelText('Volume (ml)'), '300')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Algo deu errado. Tente de novo.')
    expect(screen.getByLabelText('Nome da garrafa')).toBeInTheDocument()
  })
})
