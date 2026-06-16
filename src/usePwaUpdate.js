import { useState, useEffect, useRef, useCallback } from 'react'
import { registerSW } from 'virtual:pwa-register'

const DISMISS_KEY = 'update-banner-dismissed'
const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Listens for PWA service-worker updates and exposes banner/update actions.
 */
export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const updateFnRef = useRef(null)
  const registrationRef = useRef(null)

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        registrationRef.current = registration
        setInterval(() => registration.update(), UPDATE_CHECK_MS)
      },
    })
    updateFnRef.current = updateSW

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        registrationRef.current?.update()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const applyUpdate = useCallback(() => {
    updateFnRef.current?.(true)
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // sessionStorage unavailable
    }
  }, [])

  const showBanner = needRefresh && !dismissed

  return { showBanner, applyUpdate, dismiss }
}
