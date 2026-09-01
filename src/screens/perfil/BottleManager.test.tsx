import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { BottleManager } from './BottleManager'

const createBottle = vi.fn()
const updateBottle = vi.fn()
const archiveBottle = vi.fn()

const bottle = {
  id: 'b1',
  profile_id: 'u1',
  name: 'Garrafa azul',
  volume_ml: 1500,
  emoji: '💙',
  archived_at: null,
  created_at: '2026-08-01T00:00:00Z',
}

vi.mock('@/features/bottles/queries', () => ({
  useBottles: () => ({ data: [bottle] }),
}))
vi.mock('@/features/bottles/mutations', () => ({
  createBottle: (...args: unknown[]) => createBottle(...args),
  updateBottle: (...args: unknown[]) => updateBottle(...args),
  archiveBottle: (...args: unknown[]) => archiveBottle(...args),
}))

describe('BottleManager', () => {
  beforeEach(() => {
    createBottle.mockReset().mockResolvedValue({ ...bottle, id: 'b2' })
    updateBottle.mockReset().mockResolvedValue(undefined)
    archiveBottle.mockReset().mockResolvedValue(undefined)
  })

  it('lists bottles with volume', () => {
    renderWithProviders(<BottleManager userId="u1" />)
    expect(screen.getByText('Garrafa azul')).toBeInTheDocument()
    expect(screen.getByText('1,5 L')).toBeInTheDocument()
  })

  it('creates a bottle from the add form', async () => {
    renderWithProviders(<BottleManager userId="u1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar garrafa' }))
    await userEvent.type(screen.getByLabelText('Nome da garrafa'), 'Copo')
    await userEvent.type(screen.getByLabelText('Volume (ml)'), '300')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(createBottle).toHaveBeenCalledWith('u1', { name: 'Copo', volume_ml: 300, emoji: null })
  })

  it('rejects an invalid volume with a pt-BR error', async () => {
    renderWithProviders(<BottleManager userId="u1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar garrafa' }))
    await userEvent.type(screen.getByLabelText('Nome da garrafa'), 'Copo')
    await userEvent.type(screen.getByLabelText('Volume (ml)'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Volume entre 1 e 10.000 ml')).toBeInTheDocument()
    expect(createBottle).not.toHaveBeenCalled()
  })

  it('archives only on the second tap', async () => {
    renderWithProviders(<BottleManager userId="u1" />)
    await userEvent.click(screen.getByText('Garrafa azul'))
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    expect(archiveBottle).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar mesmo?' }))
    expect(archiveBottle).toHaveBeenCalledWith('b1')
  })

  it('resets the archive confirmation when the row is closed and reopened', async () => {
    renderWithProviders(<BottleManager userId="u1" />)
    await userEvent.click(screen.getByText('Garrafa azul'))
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    await userEvent.click(screen.getByText('Garrafa azul')) // collapse
    await userEvent.click(screen.getByText('Garrafa azul')) // reopen
    expect(screen.getByRole('button', { name: 'Arquivar' })).toBeInTheDocument()
    expect(archiveBottle).not.toHaveBeenCalled()
  })

  it('shows a pt-BR error when a mutation fails', async () => {
    createBottle.mockRejectedValueOnce(new Error('boom'))
    renderWithProviders(<BottleManager userId="u1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar garrafa' }))
    await userEvent.type(screen.getByLabelText('Nome da garrafa'), 'Copo')
    await userEvent.type(screen.getByLabelText('Volume (ml)'), '300')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Algo deu errado. Tente de novo.')).toBeInTheDocument()
  })
})
