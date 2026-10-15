import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '../ui/tooltip'
import { ProjectDeck } from './ProjectDeck'
import { LONG_PRESS_MS } from './useLongPressReorder'
import type { Principle, DeckInterpretations } from './types'

const p1: Principle = { id: 'P006', name: 'Transparency', keywords: 'Open decisions.', practice: '' }
const p2: Principle = { id: 'P007', name: 'Privacy', keywords: 'Protect data.', practice: '' }
const p3: Principle = { id: 'P008', name: 'Fairness', keywords: 'Treat alike.', practice: '' }

const emptyInterpretations: DeckInterpretations = {}

const defaultProps = {
  interpretations: emptyInterpretations,
  onInterpretationChange: vi.fn(),
  onReorder: vi.fn(),
}

function wrap(ui: React.ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('ProjectDeck', () => {
  it('shows empty state when deck is empty', () => {
    wrap(<ProjectDeck deck={[]} {...defaultProps} />)
    expect(screen.getByText(/No principles loaded/)).toBeInTheDocument()
  })

  it('renders principle names', () => {
    wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} />)
    expect(screen.getByText('Transparency')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
  })

  it('numbers the relevant principles by priority', () => {
    wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
  })

  it('textarea is hidden until card is expanded', () => {
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} />)
    expect(screen.queryByPlaceholderText(/How does "Transparency" apply/)).not.toBeInTheDocument()
  })

  it('reveals textarea inside card when expanded', async () => {
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} />)
    await userEvent.click(screen.getByText('Transparency'))
    expect(screen.getByPlaceholderText(/How does "Transparency" apply/)).toBeInTheDocument()
  })

  it('calls onInterpretationChange when textarea changes after expand', async () => {
    const onInterpretationChange = vi.fn()
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} onInterpretationChange={onInterpretationChange} />)
    await userEvent.click(screen.getByText('Transparency'))
    await userEvent.type(screen.getByPlaceholderText(/How does "Transparency" apply/), 'x')
    expect(onInterpretationChange).toHaveBeenCalledWith('P006', expect.objectContaining({ context: 'x' }))
  })

  it('typing in the interpretation does not collapse the row', async () => {
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} />)
    await userEvent.click(screen.getByText('Transparency'))
    const textarea = screen.getByPlaceholderText(/How does "Transparency" apply/)
    await userEvent.click(textarea)
    expect(screen.getByPlaceholderText(/How does "Transparency" apply/)).toBeInTheDocument()
  })

  it('calls onInterpretationChange with irrelevant:true when set-aside button is clicked', async () => {
    const onInterpretationChange = vi.fn()
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} onInterpretationChange={onInterpretationChange} />)
    await userEvent.click(screen.getByText('Transparency'))
    await userEvent.click(screen.getByRole('button', { name: /Set aside/i }))
    expect(onInterpretationChange).toHaveBeenCalledWith('P006', expect.objectContaining({ irrelevant: true }))
  })

  it('moves a principle to set-aside section when marked irrelevant', () => {
    const interpretations: DeckInterpretations = { P006: { context: '', irrelevant: true } }
    wrap(<ProjectDeck deck={[p1]} {...defaultProps} interpretations={interpretations} />)
    expect(screen.getByText('Set aside')).toBeInTheDocument()
  })

  it('calls onInterpretationChange with irrelevant:false when undo button clicked in set-aside', async () => {
    const onInterpretationChange = vi.fn()
    const interpretations: DeckInterpretations = { P006: { context: '', irrelevant: true } }
    wrap(
      <ProjectDeck
        deck={[p1]}
        {...defaultProps}
        interpretations={interpretations}
        onInterpretationChange={onInterpretationChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /Move back to deck/i }))
    expect(onInterpretationChange).toHaveBeenCalledWith('P006', expect.objectContaining({ irrelevant: false }))
  })

  describe('press-and-hold reordering', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    const rowsOf = (container: HTMLElement) =>
      container.querySelectorAll<HTMLElement>('[data-slot="row"]')

    /** Hold row `from` until it travels, move onto row `to`, release there. */
    function holdAndDrop(container: HTMLElement, from: number, to: number) {
      const rows = rowsOf(container)
      fireEvent.pointerDown(rows[from], { button: 0, clientX: 0, clientY: 0 })
      act(() => void vi.advanceTimersByTime(LONG_PRESS_MS))
      fireEvent.pointerMove(rows[to], { clientX: 0, clientY: 0 })
      fireEvent.pointerUp(window)
      fireEvent.click(rows[from])
    }

    /** Press and release before the hold threshold — a plain click. */
    function shortClick(row: HTMLElement) {
      fireEvent.pointerDown(row, { button: 0, clientX: 0, clientY: 0 })
      act(() => void vi.advanceTimersByTime(LONG_PRESS_MS - 50))
      fireEvent.pointerUp(window)
      fireEvent.click(row)
    }

    it('reorders the whole row, no handle needed', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2, p3]} {...defaultProps} onReorder={onReorder} />)
      holdAndDrop(container, 2, 0)
      expect(onReorder).toHaveBeenCalledWith([p3, p1, p2])
    })

    it('inserts the principle after the target when dragged downwards', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2, p3]} {...defaultProps} onReorder={onReorder} />)
      holdAndDrop(container, 0, 2)
      expect(onReorder).toHaveBeenCalledWith([p2, p3, p1])
    })

    it('does not reorder when a principle is dropped on itself', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2, p3]} {...defaultProps} onReorder={onReorder} />)
      holdAndDrop(container, 1, 1)
      expect(onReorder).not.toHaveBeenCalled()
    })

    it('does not expand the row it just dropped', () => {
      const { container } = wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} />)
      holdAndDrop(container, 1, 0)
      expect(screen.queryByText('Protect data.')).not.toBeInTheDocument()
    })

    it('expands the row on a short click instead of reordering', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} onReorder={onReorder} />)
      shortClick(rowsOf(container)[0])
      expect(screen.getByText('Open decisions.')).toBeInTheDocument()
      expect(onReorder).not.toHaveBeenCalled()
    })

    it('abandons the hold when the pointer travels before it fires', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} onReorder={onReorder} />)
      const rows = rowsOf(container)
      fireEvent.pointerDown(rows[0], { button: 0, clientX: 0, clientY: 0 })
      // A scroll gesture: the pointer leaves the hold tolerance first.
      fireEvent.pointerMove(window, { clientX: 0, clientY: 60 })
      act(() => void vi.advanceTimersByTime(LONG_PRESS_MS))
      fireEvent.pointerMove(rows[1], { clientX: 0, clientY: 60 })
      fireEvent.pointerUp(window)
      expect(onReorder).not.toHaveBeenCalled()
    })

    it('reorders with Alt and the arrow keys', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2, p3]} {...defaultProps} onReorder={onReorder} />)
      fireEvent.keyDown(rowsOf(container)[2], { key: 'ArrowUp', altKey: true })
      expect(onReorder).toHaveBeenCalledWith([p1, p3, p2])
    })

    it('ignores Alt and the arrow keys beyond the ends of the list', () => {
      const onReorder = vi.fn()
      const { container } = wrap(<ProjectDeck deck={[p1, p2]} {...defaultProps} onReorder={onReorder} />)
      fireEvent.keyDown(rowsOf(container)[0], { key: 'ArrowUp', altKey: true })
      expect(onReorder).not.toHaveBeenCalled()
    })

    it('leaves the set-aside principles out of the ranking', () => {
      const onReorder = vi.fn()
      const interpretations: DeckInterpretations = { P007: { context: '', irrelevant: true } }
      const { container } = wrap(
        <ProjectDeck deck={[p1, p2, p3]} {...defaultProps} interpretations={interpretations} onReorder={onReorder} />
      )
      holdAndDrop(container, 1, 0)
      expect(onReorder).toHaveBeenCalledWith([p3, p1])
    })
  })
})
