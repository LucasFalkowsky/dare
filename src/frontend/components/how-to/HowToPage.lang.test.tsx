import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import { HowToPage } from './HowToPage'

/**
 * `?lang=` is a page-local override. Switching the global i18next language
 * would change the locale the deck sends to `deck.rankPrinciples`, which is
 * what names the work-item labels — a second set of labels would orphan the
 * first (ADR-012). These two tests are the guard for that.
 */
describe('HowToPage with ?lang=', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('renders principle content in the requested language', () => {
    window.history.pushState({}, '', '/how-to?lang=de')
    render(<HowToPage />)

    expect(screen.getByText('Nachhaltigkeit')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Wohltun' })).toBeInTheDocument()
  })

  it('leaves the global language untouched', () => {
    const before = i18n.language
    window.history.pushState({}, '', '/how-to?lang=de')

    render(<HowToPage />)

    expect(i18n.language).toBe(before)
  })

  it('ignores an unsupported language', () => {
    window.history.pushState({}, '', '/how-to?lang=klingon')
    render(<HowToPage />)

    expect(screen.getByText('Sustainability')).toBeInTheDocument()
  })
})
