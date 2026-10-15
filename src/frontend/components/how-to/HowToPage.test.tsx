import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import en from '../../../locales/en'
import { HowToPage } from './HowToPage'

const PRINCIPLE_NAMES = Object.values(en).map((entry) => entry.name)

describe('HowToPage', () => {
  // No tRPC provider on purpose: the page must stay readable when the
  // backend is unreachable mid-session.
  it('renders without any provider', () => {
    render(<HowToPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How DARE works here')
  })

  it('renders all four section titles', () => {
    render(<HowToPage />)
    for (const title of [
      'What the principles are for',
      'Writing an interpretation',
      'What the order means',
      'How this reaches your work',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  it('puts the vocabulary before the procedure', () => {
    render(<HowToPage />)
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(headings[0]).toBe('Four words, first')
  })

  it('renders all nine principles and their three categories', () => {
    render(<HowToPage />)
    // getAllByText, because three principles are named after their own
    // category (Beneficence, Dignity, Justice) and so appear twice.
    for (const name of PRINCIPLE_NAMES) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    for (const category of ['Beneficence', 'Dignity', 'Justice']) {
      expect(screen.getByRole('heading', { level: 3, name: category })).toBeInTheDocument()
    }
  })

  it('keeps the background explanation collapsed until asked for', async () => {
    render(<HowToPage />)
    expect(screen.queryByText(en.P001.practice)).toBeInTheDocument() // reference is always visible
    expect(screen.queryByText(/deliberately simplified version/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /why the page looks like this/i }))

    expect(screen.getByText(/deliberately simplified version/i)).toBeInTheDocument()
  })

  it('calls onBackToDeck instead of navigating', async () => {
    const onBackToDeck = vi.fn()
    render(<HowToPage onBackToDeck={onBackToDeck} />)

    await userEvent.click(screen.getByRole('link', { name: /back to the deck/i }))

    expect(onBackToDeck).toHaveBeenCalledOnce()
  })
})
