import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePostUpdateReleaseNotes } from './usePostUpdateReleaseNotes.js'
import { UPDATE_PENDING_KEY } from '../usePwaUpdate.js'
import { APP_VERSION } from '../version.js'
import * as releaseNotes from '../utils/releaseNotes.js'

describe('usePostUpdateReleaseNotes', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows release notes when the update-pending flag is set and notes exist', async () => {
    sessionStorage.setItem(UPDATE_PENDING_KEY, '1')
    const expectedNotes = releaseNotes.getReleaseNotes(APP_VERSION)
    expect(expectedNotes).not.toBeNull()

    const { result } = renderHook(() => usePostUpdateReleaseNotes())

    await waitFor(() => {
      expect(result.current.showReleaseNotes).toBe(true)
    })
    expect(result.current.releaseNotes).toEqual(expectedNotes)
    expect(sessionStorage.getItem(UPDATE_PENDING_KEY)).toBe('1')
  })

  it('clears the flag on dismiss', async () => {
    sessionStorage.setItem(UPDATE_PENDING_KEY, '1')

    const { result } = renderHook(() => usePostUpdateReleaseNotes())

    await waitFor(() => {
      expect(result.current.showReleaseNotes).toBe(true)
    })

    act(() => result.current.dismissReleaseNotes())

    expect(result.current.showReleaseNotes).toBe(false)
    expect(sessionStorage.getItem(UPDATE_PENDING_KEY)).toBeNull()
  })

  it('clears the flag silently when no notes exist for the current version', async () => {
    sessionStorage.setItem(UPDATE_PENDING_KEY, '1')
    vi.spyOn(releaseNotes, 'getReleaseNotes').mockReturnValue(null)

    const { result } = renderHook(() => usePostUpdateReleaseNotes())

    await waitFor(() => {
      expect(sessionStorage.getItem(UPDATE_PENDING_KEY)).toBeNull()
    })
    expect(result.current.showReleaseNotes).toBe(false)
    expect(result.current.releaseNotes).toBeNull()
  })

  it('does nothing when the update-pending flag is not set', () => {
    const { result } = renderHook(() => usePostUpdateReleaseNotes())

    expect(result.current.showReleaseNotes).toBe(false)
    expect(result.current.releaseNotes).toBeNull()
  })
})
