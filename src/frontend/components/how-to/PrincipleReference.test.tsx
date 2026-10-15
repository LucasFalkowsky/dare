import { render, screen } from '@testing-library/react'
import en from '../../../locales/en'
import { PrincipleReference } from './PrincipleReference'

describe('PrincipleReference', () => {
  it('renders the nine principles in P001…P009 order', () => {
    render(<PrincipleReference locale="en" />)

    const handles = screen.getAllByText(/^P00\d$/).map((node) => node.textContent)
    expect(handles).toEqual(['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008', 'P009'])
  })

  it('groups them under their three localized categories', () => {
    render(<PrincipleReference locale="en" />)

    const categories = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(categories).toEqual(['Beneficence', 'Dignity', 'Justice'])
  })

  it('takes name, keywords and practice from the shared dictionaries', () => {
    render(<PrincipleReference locale="en" />)

    expect(screen.getByText(en.P005.name)).toBeInTheDocument()
    expect(screen.getByText(en.P005.keywords)).toBeInTheDocument()
    expect(screen.getByText(en.P005.practice)).toBeInTheDocument()
  })
})
