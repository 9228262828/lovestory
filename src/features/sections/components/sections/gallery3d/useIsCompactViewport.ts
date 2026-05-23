import { useEffect, useState } from 'react'

const COMPACT_QUERY = '(max-width: 640px)'

const getInitialCompactState = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(COMPACT_QUERY).matches
}

export const useIsCompactViewport = () => {
  const [isCompactViewport, setIsCompactViewport] = useState(getInitialCompactState)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(COMPACT_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactViewport(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isCompactViewport
}
