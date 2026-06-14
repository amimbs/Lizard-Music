import { useRef, useCallback, useEffect } from 'react'

export function useObjectUrls() {
  const registryRef = useRef(new Set())

  const registerUrl = useCallback((url) => {
    if (url) registryRef.current.add(url)
    return url
  }, [])

  const revokeUrl = useCallback((url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    registryRef.current.delete(url)
  }, [])

  useEffect(() => {
    const registry = registryRef.current
    return () => {
      registry.forEach((url) => URL.revokeObjectURL(url))
      registry.clear()
    }
  }, [])

  return { registerUrl, revokeUrl }
}
