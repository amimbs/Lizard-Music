export const THEME_STORAGE_KEY = 'lizard-theme'

export const THEMES = [
  { id: 'original', label: 'Original', themeColor: '#0d0d14' },
  { id: 'warm', label: 'Warm', themeColor: '#12100e' },
  { id: 'light', label: 'Light', themeColor: '#f5f5f8' },
  { id: 'midnight-blue', label: 'Midnight Blue', themeColor: '#0a0e1a' },
  { id: 'forest', label: 'Forest', themeColor: '#0a120e' },
  { id: 'rose', label: 'Rose', themeColor: '#141018' },
  { id: 'monochrome', label: 'Monochrome', themeColor: '#111111' },
  { id: 'neon', label: 'Neon', themeColor: '#08080c' },
  { id: 'sepia', label: 'Sepia', themeColor: '#1a1610' },
  { id: 'ocean', label: 'Ocean', themeColor: '#081418' },
  { id: 'sunset', label: 'Sunset', themeColor: '#120e14' },
  { id: 'paper', label: 'Paper', themeColor: '#faf8f5' },
  { id: 'sky', label: 'Sky', themeColor: '#eef4fa' },
  { id: 'mint', label: 'Mint', themeColor: '#eef8f5' },
  { id: 'high-contrast', label: 'High Contrast', themeColor: '#000000' },
]

export const LIGHT_THEMES = new Set(['light', 'paper', 'sky', 'mint'])

export const DEFAULT_THEME = 'original'

export const THEME_IDS = new Set(THEMES.map((theme) => theme.id))

export function isValidTheme(id) {
  return THEME_IDS.has(id)
}

export function isLightTheme(id) {
  return LIGHT_THEMES.has(id)
}
