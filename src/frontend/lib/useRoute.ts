import { useCallback, useEffect, useState } from 'react'

export type Route = 'deck' | 'how-to'

export const ROUTE_PATH: Record<Route, string> = {
  deck: '/',
  'how-to': '/how-to',
}

/**
 * Two static client routes over the History API — no router dependency.
 *
 * `/how-to` is the only possible name for the second route: the dev server
 * proxies `/api`, `/trpc`, `/principles`, `/health` and `/webhooks` to the
 * backend (see `vite.config.ts`), so a client route under any of those
 * prefixes is unreachable in development.
 */
function routeFromPath(pathname: string): Route {
  // Unknown paths fall back to the deck — the app has no 404 view.
  return pathname.replace(/\/+$/, '') === ROUTE_PATH['how-to'] ? 'how-to' : 'deck'
}

export function useRoute(): { route: Route; navigate: (to: Route) => void } {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: Route) => {
    // The query string survives navigation so `?lang=` keeps working.
    window.history.pushState({}, '', ROUTE_PATH[to] + window.location.search)
    setRoute(to)
    window.scrollTo(0, 0)
  }, [])

  return { route, navigate }
}
