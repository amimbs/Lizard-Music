import { useState, useCallback, useEffect } from 'react'
import { APP_VERSION } from '../version.js'
import { getReleaseNotes } from '../utils/releaseNotes.js'
import { UPDATE_PENDING_KEY } from '../usePwaUpdate.js'

/**
 * Shows release notes once after the user applies a PWA update and the app reloads.
 */
export function usePostUpdateReleaseNotes() {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(UPDATE_PENDING_KEY) !== '1') return
      const notes = getReleaseNotes(APP_VERSION)
      if (notes) {
        setReleaseNotes(notes)
        setShowReleaseNotes(true)
      } else {
        sessionStorage.removeItem(UPDATE_PENDING_KEY)
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [])

  const dismissReleaseNotes = useCallback(() => {
    setShowReleaseNotes(false)
    try {
      sessionStorage.removeItem(UPDATE_PENDING_KEY)
    } catch {
      // sessionStorage unavailable
    }
  }, [])

  return { showReleaseNotes, dismissReleaseNotes, releaseNotes }
}
