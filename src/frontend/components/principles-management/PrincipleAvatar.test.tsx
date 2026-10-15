import { render, screen } from '@testing-library/react'
import { PrincipleAvatar } from './PrincipleAvatar'

describe('PrincipleAvatar', () => {
  it('renders initials for a single-word name', () => {
    render(<PrincipleAvatar name="Transparency" />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('renders two initials for a multi-word name', () => {
    render(<PrincipleAvatar name="Non Maleficence" />)
    expect(screen.getByText('NM')).toBeInTheDocument()
  })

  it('renders at most two initials', () => {
    render(<PrincipleAvatar name="One Two Three" />)
    expect(screen.getByText('OT')).toBeInTheDocument()
  })

  it('renders initials in uppercase', () => {
    render(<PrincipleAvatar name="autonomy" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
