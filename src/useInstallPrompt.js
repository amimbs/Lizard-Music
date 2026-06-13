import { useState, useEffect, useRef, useCallback } from 'react'

const DISMISS_KEY = 'install-banner-dismissed'

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isMobileDevice() {
  return window.matchMedia('(pointer: coarse)').matches
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const promptRef = useRef(null)

  useEffect(() => {
    if (isStandalone()) return

    const onBeforeInstall = (e) => {
      e.preventDefault()
      promptRef.current = e
      setCanInstall(true)
    }

    const onInstalled = () => {
      promptRef.current = null
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    const prompt = promptRef.current
    if (!prompt) return false
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      promptRef.current = null
      setCanInstall(false)
      return true
    }
    return false
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // sessionStorage unavailable
    }
  }, [])

  const standalone = isStandalone()
  const showBanner = canInstall && !dismissed && !standalone
  const showManualHint =
    !standalone && !canInstall && isMobileDevice() && !dismissed

  return { showBanner, showManualHint, install, dismiss, isStandalone: standalone }
}
