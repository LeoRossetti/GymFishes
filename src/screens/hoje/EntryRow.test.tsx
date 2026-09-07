import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { EntryRow } from './EntryRow'
import type { Entry } from '@/features/entries/cache'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({ data: { signedUrl: 'https://x/signed.jpg' }, error: null }),
      }),
    },
  },
}))

const entry = {
  id: 'e1',
  profile_id: 'u1',
  group_id: 'g1',
  total_ml: 1800,
  composition: [
    { kind: 'bottle', name: 'Garrafa azul', volume_ml: 1500, qty: 1 },
    { kind: 'loose', amount_ml: 300 },
  ],
  note: 'pós treino',
  photo_path: null,
  thumb_path: null,
  drank_at: '2026-09-01T14:00:00+00:00',
  drank_on: '2026-09-01',
  created_at: '2026-09-01T14:00:00+00:00',
  updated_at: '2026-09-01T14:00:00+00:00',
  deleted_at: null,
} as Entry

function renderRow(overrides: Partial<Parameters<typeof EntryRow>[0]> = {}) {
  return renderWithProviders(
    <EntryRow
      entry={entry}
      authorName="Leo"
      isOwn
      pending={false}
      failed={false}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onRetry={vi.fn()}
      {...overrides}
    />,
  )
}

describe('EntryRow', () => {
  it('shows author, time, note and total', () => {
    renderRow()
    expect(screen.getByText(/Leo · 11:00/)).toBeInTheDocument() // 14:00Z = 11:00 São Paulo
    expect(screen.getByText('pós treino')).toBeInTheDocument()
    expect(screen.getByText('1,8 L')).toBeInTheDocument()
  })

  it('expands to composition chips and actions on own rows', async () => {
    const onEdit = vi.fn()
    renderRow({ onEdit })
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    expect(screen.getByText('1 × Garrafa azul 1,5 L')).toBeInTheDocument()
    expect(screen.getByText('+ 300 ml')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('hides actions on the partner rows', async () => {
    renderRow({ authorName: 'Ana', isOwn: false })
    await userEvent.click(screen.getByText(/Ana · 11:00/))
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  })

  it('deletes only on the second tap', async () => {
    const onDelete = vi.fn()
    renderRow({ onDelete })
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir mesmo?' }))
    expect(onDelete).toHaveBeenCalled()
  })

  it('resets the delete confirm when the row collapses', async () => {
    const onDelete = vi.fn()
    renderRow({ onDelete })
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    await userEvent.click(screen.getByText(/Leo · 11:00/)) // collapse
    await userEvent.click(screen.getByText(/Leo · 11:00/)) // re-expand
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('shows the thumbnail once the signed URL resolves', async () => {
    const withThumb = { ...entry, thumb_path: 'g1/u1/e1_thumb.jpg' } as Entry
    const { container } = renderRow({ entry: withThumb })
    // the thumb is decorative (alt=""), so it carries an ARIA "presentation" role rather
    // than "img" — assert on the element directly instead of screen.findByRole('img')
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument())
  })

  it('shows the pending dot while the entry waits in the outbox', () => {
    renderRow({ pending: true })
    expect(screen.getByRole('img', { name: 'Aguardando envio' })).toBeInTheDocument()
  })

  it('a failed entry shows the retry line and taps call onRetry', async () => {
    const onRetry = vi.fn()
    renderRow({ failed: true, onRetry })
    await userEvent.click(
      screen.getByRole('button', { name: 'Falha ao enviar — tentar novamente' }),
    )
    expect(onRetry).toHaveBeenCalled()
  })

  it('a pending own entry still offers Editar when expanded', async () => {
    // deviation settled in this plan: pending entries stay editable; edits merge into the queued op
    renderRow({ pending: true })
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })
})
