import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  isValidTheme,
} from '../themes.js'

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isValidTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function applyTheme(themeId) {
  const theme = isValidTheme(themeId) ? themeId : DEFAULT_THEME
  document.documentElement.setAttribute('data-theme', theme)

  const themeColor = THEMES.find((entry) => entry.id === theme)?.themeColor
  if (themeColor) {
    let meta = document.querySelector('meta[name="theme-color"]:not([media])')
    if (!meta) {
      meta = document.querySelector('meta[name="theme-color"]')
    }
    if (meta) {
      meta.setAttribute('content', themeColor)
    }
  }

  return theme
}

export function initTheme() {
  return applyTheme(readStoredTheme())
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => initTheme())

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable
    }
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    if (!isValidTheme(nextTheme)) return
    setThemeState(nextTheme)
  }, [])

  return { theme, setTheme }
}
