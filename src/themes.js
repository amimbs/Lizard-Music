export const THEME_STORAGE_KEY = 'lizard-theme'

export const THEMES = [
  { id: 'original', label: 'Original', themeColor: '#0d0d14' },
  { id: 'warm', label: 'Warm', themeColor: '#12100e' },
  { id: 'light', label: 'Light', themeColor: '#f5f5f8' },
]

export const DEFAULT_THEME = 'original'

export const THEME_IDS = new Set(THEMES.map((theme) => theme.id))

export function isValidTheme(id) {
  return THEME_IDS.has(id)
}
