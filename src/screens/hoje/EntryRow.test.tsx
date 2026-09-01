import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryRow } from './EntryRow'
import type { Entry } from '@/features/entries/cache'

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

describe('EntryRow', () => {
  it('shows author, time, note and total', () => {
    render(<EntryRow entry={entry} authorName="Leo" isOwn onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/Leo · 11:00/)).toBeInTheDocument() // 14:00Z = 11:00 São Paulo
    expect(screen.getByText('pós treino')).toBeInTheDocument()
    expect(screen.getByText('1,8 L')).toBeInTheDocument()
  })

  it('expands to composition chips and actions on own rows', async () => {
    const onEdit = vi.fn()
    render(<EntryRow entry={entry} authorName="Leo" isOwn onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    expect(screen.getByText('1 × Garrafa azul 1,5 L')).toBeInTheDocument()
    expect(screen.getByText('+ 300 ml')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('hides actions on the partner rows', async () => {
    render(
      <EntryRow entry={entry} authorName="Ana" isOwn={false} onEdit={vi.fn()} onDelete={vi.fn()} />,
    )
    await userEvent.click(screen.getByText(/Ana · 11:00/))
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  })

  it('deletes only on the second tap', async () => {
    const onDelete = vi.fn()
    render(<EntryRow entry={entry} authorName="Leo" isOwn onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByText(/Leo · 11:00/))
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onDelete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir mesmo?' }))
    expect(onDelete).toHaveBeenCalled()
  })
})
