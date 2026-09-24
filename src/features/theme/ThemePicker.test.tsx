import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemePicker } from './ThemePicker'
import { THEME_STORAGE_KEY } from './theme'

describe('ThemePicker (spec M7 §7.4)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('offers the six themes by name with the current one pressed', () => {
    render(<ThemePicker />)
    expect(screen.getByRole('heading', { name: 'Tema' })).toBeInTheDocument()
    const names = ['Fundo do mar', 'Tinta', 'Aquário', 'Meia-noite', 'Areia', 'Breu']
    for (const name of names) expect(screen.getByRole('button', { name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fundo do mar' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
  })

  it('tapping a tile applies and stores that theme at once, no save step', async () => {
    render(<ThemePicker />)
    await userEvent.click(screen.getByRole('button', { name: 'Areia' }))
    expect(screen.getByRole('button', { name: 'Areia' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Fundo do mar' })).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.theme).toBe('areia')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('areia')
  })

  it('each tile previews its own theme, not the current one', () => {
    render(<ThemePicker />)
    const breu = screen.getByRole('button', { name: 'Breu' })
    expect(breu.querySelector('[data-preview="bg"]')).toHaveStyle({ backgroundColor: '#0D0F12' })
  })
})
