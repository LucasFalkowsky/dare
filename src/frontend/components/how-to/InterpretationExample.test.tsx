import { render, screen } from '@testing-library/react'
import howTo from '../../locales/how-to/en'
import { InterpretationExample } from './InterpretationExample'

const t = (key: string) =>
  key.split('.').reduce<any>((value, part) => value?.[part], { howTo }) ?? key

describe('InterpretationExample', () => {
  it('lists all five criteria', () => {
    render(<InterpretationExample t={t} />)
    for (const criterion of Object.values(howTo.interpretation.criteria)) {
      expect(screen.getByText(criterion)).toBeInTheDocument()
    }
  })

  it('shows both the weak and the good wording with its reason', () => {
    render(<InterpretationExample t={t} />)

    expect(screen.getByText(howTo.interpretation.weak)).toBeInTheDocument()
    expect(screen.getByText(howTo.interpretation.weakWhy)).toBeInTheDocument()
    expect(screen.getByText(howTo.interpretation.good)).toBeInTheDocument()
    expect(screen.getByText(howTo.interpretation.goodWhy)).toBeInTheDocument()
  })

  // The weak/good distinction must not rest on colour: each side carries a
  // text label, and the icons are hidden from assistive technology.
  it('labels each side in text, not only by colour', () => {
    render(<InterpretationExample t={t} />)

    expect(screen.getByText(howTo.interpretation.weakLabel)).toBeInTheDocument()
    expect(screen.getByText(howTo.interpretation.goodLabel)).toBeInTheDocument()
  })

  it('hides its icons from assistive technology', () => {
    const { container } = render(<InterpretationExample t={t} />)

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden')
    }
  })

  it('points each example at its reason for screen readers', () => {
    render(<InterpretationExample t={t} />)

    const quote = screen.getByText(howTo.interpretation.weak)
    const describedBy = quote.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      howTo.interpretation.weakWhy,
    )
  })
})
