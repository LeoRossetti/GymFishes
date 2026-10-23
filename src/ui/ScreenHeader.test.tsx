import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScreenHeader } from './ScreenHeader'

describe('ScreenHeader', () => {
  it('names the screen in its one heading', () => {
    render(<ScreenHeader title="Ranking" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ranking' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the line under the title only when there is one', () => {
    const { rerender } = render(<ScreenHeader title="Hoje" subtitle="quinta, 22 de outubro" />)
    expect(screen.getByText('quinta, 22 de outubro')).toBeInTheDocument()
    rerender(<ScreenHeader title="Hoje" />)
    expect(screen.queryByText('quinta, 22 de outubro')).toBeNull()
  })

  it('puts the status on its own line under the title, inside the header', () => {
    render(<ScreenHeader title="Histórico" status={<span role="status">Sem conexão</span>} />)
    const status = screen.getByRole('status')
    const heading = screen.getByRole('heading')
    expect(screen.getByRole('banner')).toContainElement(status)
    expect(status.parentElement).not.toBe(heading.parentElement)
    expect(heading.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
