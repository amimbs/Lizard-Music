import { useEffect } from 'react'

export function useKeyboardShortcuts({ togglePlay, next, prev }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        next()
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, next, prev])
}
