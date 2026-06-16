import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePwaUpdate } from './usePwaUpdate.js'

const registerSW = vi.fn()

vi.mock('virtual:pwa-register', () => ({
  registerSW: (...args) => registerSW(...args),
}))

describe('usePwaUpdate', () => {
  beforeEach(() => {
    registerSW.mockReset()
    sessionStorage.clear()
    registerSW.mockImplementation(() => vi.fn())
  })

  it('registers the service worker on mount', () => {
    renderHook(() => usePwaUpdate())

    expect(registerSW).toHaveBeenCalledWith(
      expect.objectContaining({
        immediate: true,
        onNeedRefresh: expect.any(Function),
        onRegisteredSW: expect.any(Function),
      }),
    )
  })

  it('shows the banner when an update is needed', () => {
    let onNeedRefresh
    registerSW.mockImplementation((options) => {
      onNeedRefresh = options.onNeedRefresh
      return vi.fn()
    })

    const { result } = renderHook(() => usePwaUpdate())

    act(() => onNeedRefresh())

    expect(result.current.showBanner).toBe(true)
  })

  it('applies the update when requested', () => {
    const applyUpdate = vi.fn()
    registerSW.mockImplementation(() => applyUpdate)

    const { result } = renderHook(() => usePwaUpdate())

    act(() => result.current.applyUpdate())

    expect(applyUpdate).toHaveBeenCalledWith(true)
  })

  it('hides the banner after dismiss until the next session', () => {
    let onNeedRefresh
    registerSW.mockImplementation((options) => {
      onNeedRefresh = options.onNeedRefresh
      return vi.fn()
    })

    const { result } = renderHook(() => usePwaUpdate())

    act(() => onNeedRefresh())
    expect(result.current.showBanner).toBe(true)

    act(() => result.current.dismiss())
    expect(result.current.showBanner).toBe(false)
    expect(sessionStorage.getItem('update-banner-dismissed')).toBe('1')
  })
})
