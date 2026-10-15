import { act, renderHook } from '@testing-library/react'
import { ROUTE_PATH, useRoute } from './useRoute'

function setPath(path: string) {
  window.history.pushState({}, '', path)
}

describe('useRoute', () => {
  afterEach(() => setPath('/'))

  it('maps / to the deck', () => {
    setPath('/')
    expect(renderHook(() => useRoute()).result.current.route).toBe('deck')
  })

  it('maps /how-to to the how-to route', () => {
    setPath('/how-to')
    expect(renderHook(() => useRoute()).result.current.route).toBe('how-to')
  })

  it('ignores a trailing slash', () => {
    setPath('/how-to/')
    expect(renderHook(() => useRoute()).result.current.route).toBe('how-to')
  })

  it('falls back to the deck for unknown paths', () => {
    setPath('/does-not-exist')
    expect(renderHook(() => useRoute()).result.current.route).toBe('deck')
  })

  it('navigate changes the pathname and the route', () => {
    setPath('/')
    const { result } = renderHook(() => useRoute())

    act(() => result.current.navigate('how-to'))

    expect(window.location.pathname).toBe(ROUTE_PATH['how-to'])
    expect(result.current.route).toBe('how-to')
  })

  it('navigate keeps the query string so ?lang= survives', () => {
    setPath('/?lang=fr')
    const { result } = renderHook(() => useRoute())

    act(() => result.current.navigate('how-to'))

    expect(window.location.search).toBe('?lang=fr')
  })

  it('follows browser back and forward', () => {
    setPath('/how-to')
    const { result } = renderHook(() => useRoute())

    act(() => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current.route).toBe('deck')
  })
})
