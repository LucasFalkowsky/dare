import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingHint } from './OnboardingHint'

describe('OnboardingHint', () => {
  it('renders hint text when open', () => {
    render(<OnboardingHint open onDismiss={vi.fn()}>Expand cards to add context.</OnboardingHint>)
    expect(screen.getByText('Expand cards to add context.')).toBeInTheDocument()
  })

  it('renders nothing when not open', () => {
    render(<OnboardingHint open={false} onDismiss={vi.fn()}>Expand cards to add context.</OnboardingHint>)
    expect(screen.queryByText('Expand cards to add context.')).not.toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<OnboardingHint open onDismiss={onDismiss}>Hint text</OnboardingHint>)
    await userEvent.click(screen.getByRole('button', { name: /dismiss hint/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
