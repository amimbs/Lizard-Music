import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { applyTheme, initTheme, useTheme } from './useTheme.js'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '../themes.js'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', '#0d0d14')
    document.head.appendChild(meta)
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to original theme', () => {
    expect(initTheme()).toBe(DEFAULT_THEME)
    expect(document.documentElement.getAttribute('data-theme')).toBe('original')
  })

  it('reads a stored theme on init', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'warm')
    expect(initTheme()).toBe('warm')
    expect(document.documentElement.getAttribute('data-theme')).toBe('warm')
  })

  it('falls back to original for invalid stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid')
    expect(initTheme()).toBe(DEFAULT_THEME)
  })

  it('applyTheme updates data-theme and meta theme-color', () => {
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#f5f5f8',
    )
  })

  it('persists theme selection via useTheme', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('warm')
    })

    expect(result.current.theme).toBe('warm')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('warm')
    expect(document.documentElement.getAttribute('data-theme')).toBe('warm')
  })

  it('ignores invalid theme ids', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('not-a-theme')
    })

    expect(result.current.theme).toBe(DEFAULT_THEME)
  })
})
