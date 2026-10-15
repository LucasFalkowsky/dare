import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrincipleRowCard } from './PrincipleRowCard'
import type { Principle } from './types'

const principle: Principle = {
  id: 'transparency',
  name: 'Transparency',
  keywords: 'Being open about decisions.',
  practice: 'Document all decisions publicly.',
}

describe('PrincipleRowCard', () => {
  it('renders the principle name', () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} />)
    expect(screen.getByText('Transparency')).toBeInTheDocument()
  })

  it('expands to show description on click', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} />)
    expect(screen.queryByText('Being open about decisions.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Transparency'))
    expect(screen.getByText('Being open about decisions.')).toBeInTheDocument()
  })

  it('shows practice section when expanded', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} />)
    await userEvent.click(screen.getByText('Transparency'))
    expect(screen.getByText('Document all decisions publicly.')).toBeInTheDocument()
    expect(screen.getByText('In practice')).toBeInTheDocument()
  })

  it('shows editable textarea for interpretation when onContextChange is provided and card is expanded', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onContextChange={vi.fn()} projectContext="" />)
    await userEvent.click(screen.getByText('Transparency'))
    expect(screen.getByPlaceholderText(/How does "Transparency" apply/)).toBeInTheDocument()
  })

  it('shows Done button when interpretation textarea has content', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onContextChange={vi.fn()} projectContext="My context" />)
    await userEvent.click(screen.getByText('Transparency'))
    // starts confirmed because projectContext is provided
    expect(screen.queryByPlaceholderText(/How does "Transparency" apply/)).not.toBeInTheDocument()
    expect(screen.getByText('My context')).toBeInTheDocument()
  })

  it('clicking Done confirms interpretation and shows read-only text', async () => {
    const onContextChange = vi.fn()
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onContextChange={onContextChange} projectContext="" />)
    await userEvent.click(screen.getByText('Transparency'))
    const textarea = screen.getByPlaceholderText(/How does "Transparency" apply/)
    await userEvent.type(textarea, 'My context')
    onContextChange.mockImplementation(() => {})
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onContextChange={onContextChange} projectContext="My context" />)
  })

  it('shows edit button and switches back to textarea when edit icon is clicked', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onContextChange={vi.fn()} projectContext="My context" />)
    await userEvent.click(screen.getByText('Transparency'))
    await userEvent.click(screen.getByRole('button', { name: /Edit interpretation/i }))
    expect(screen.getByPlaceholderText(/How does "Transparency" apply/)).toBeInTheDocument()
  })

  it('shows read-only interpretation text when only projectContext is provided and card is expanded', async () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} projectContext="We need full audit trails." />)
    await userEvent.click(screen.getByText('Transparency'))
    expect(screen.getByText('We need full audit trails.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onExpand when card is opened', async () => {
    const onExpand = vi.fn()
    render(<PrincipleRowCard principle={principle} rightSlot={<span />} onExpand={onExpand} />)
    await userEvent.click(screen.getByText('Transparency'))
    expect(onExpand).toHaveBeenCalledOnce()
  })

  it('renders the rightSlot', () => {
    render(<PrincipleRowCard principle={principle} rightSlot={<button>Add</button>} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('renders the leftSlot when provided', () => {
    render(<PrincipleRowCard principle={principle} leftSlot={<span>42</span>} rightSlot={<span />} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
