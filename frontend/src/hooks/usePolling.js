import { useEffect, useRef, useState, useCallback } from 'react'

/*
  Simple polling hook: re-runs `fetchFn` every `intervalMs` milliseconds.
  This is how the dashboard gets "near real-time" updates without needing
  WebSockets - much simpler to build and explain for a student project,
  and perfectly fine for a bin-monitoring use case where data changes
  every few minutes, not every few milliseconds.
*/
export function usePolling(fetchFn, intervalMs = 15000, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const savedFn = useRef(fetchFn)
  savedFn.current = fetchFn

  const refresh = useCallback(async () => {
    try {
      const result = await savedFn.current()
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, lastUpdated, refresh }
}
