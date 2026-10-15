import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc } from './lib/trpc'
import App from './App'
import { resolvePrincipleContent } from '../locales'

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const trpcClient = trpc.createClient({
    links: [],
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    )
  }
}

describe('App', () => {
  afterEach(() => window.history.pushState({}, '', '/'))

  it('renders the deck view with its hint', () => {
    render(<App />, { wrapper: createTestWrapper() })
    expect(screen.getByText(/Press and hold a row to drag it/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('renders the how-to page on /how-to', () => {
    window.history.pushState({}, '', '/how-to')
    render(<App />, { wrapper: createTestWrapper() })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How DARE works here')
  })

  it('resolves localized principle content by principleId', () => {
    expect(
      resolvePrincipleContent('P001', 'de')
    ).toMatchObject({
      name: 'Wohltun',
      keywords: 'Wohlfahrt, Nutzen, Wohlbefinden, Frieden, soziales Gut, Gemeinwohl, Fürsorge',
    })
  })
})
