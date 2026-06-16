import { describe, expect, it } from 'vitest'
import { THEMES, isLightTheme, isValidTheme } from './themes.js'

describe('themes', () => {
  it('includes all defined themes with unique ids', () => {
    const ids = THEMES.map((theme) => theme.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(15)
  })

  it('validates every theme id', () => {
    for (const { id } of THEMES) {
      expect(isValidTheme(id)).toBe(true)
    }
  })

  it('identifies light themes for logo selection', () => {
    expect(isLightTheme('light')).toBe(true)
    expect(isLightTheme('paper')).toBe(true)
    expect(isLightTheme('sky')).toBe(true)
    expect(isLightTheme('mint')).toBe(true)
    expect(isLightTheme('original')).toBe(false)
    expect(isLightTheme('midnight-blue')).toBe(false)
    expect(isLightTheme('high-contrast')).toBe(false)
  })
})
