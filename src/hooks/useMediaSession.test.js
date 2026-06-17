import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaSession } from './useMediaSession.js'

function makeTrack(overrides = {}) {
  return {
    id: 't1',
    title: 'Test Song',
    artist: 'Test Artist',
    cover: 'blob:cover',
    favorite: false,
    ...overrides,
  }
}

describe('useMediaSession', () => {
  const setIsPlaying = vi.fn()
  const next = vi.fn()
  const prev = vi.fn()
  const seekTo = vi.fn()
  const onStop = vi.fn()
  const handlers = {}
  let metadata = null
  let mediaSession

  beforeEach(() => {
    vi.clearAllMocks()
    metadata = null
    Object.keys(handlers).forEach((key) => delete handlers[key])

    class MockMediaMetadata {
      constructor(data) {
        Object.assign(this, data)
        metadata = data
      }
    }

    vi.stubGlobal('MediaMetadata', MockMediaMetadata)

    mediaSession = {
      playbackState: 'none',
      setPositionState: vi.fn(),
      setActionHandler(action, handler) {
        handlers[action] = handler
      },
    }

    Object.defineProperty(mediaSession, 'metadata', {
      configurable: true,
      enumerable: true,
      get() {
        return metadata
      },
      set(value) {
        metadata = value
      },
    })

    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: mediaSession,
    })
  })

  function renderMediaSession(currentTrack = makeTrack(), isPlaying = true) {
    return renderHook(() =>
      useMediaSession({
        currentTrack,
        isPlaying,
        progress: 30,
        duration: 180,
        setIsPlaying,
        next,
        prev,
        seekTo,
        onStop,
      }),
    )
  }

  it('sets metadata title with heart prefix when track is favorited', () => {
    renderMediaSession(makeTrack({ favorite: true }))

    expect(metadata.title).toBe('♥ Test Song')
    expect(metadata.artist).toBe('Test Artist')
  })

  it('sets plain metadata title when track is not favorited', () => {
    renderMediaSession(makeTrack({ favorite: false }))

    expect(metadata.title).toBe('Test Song')
  })

  it('registers stop handler that calls onStop and clears session state', () => {
    renderMediaSession()

    expect(typeof handlers.stop).toBe('function')

    act(() => {
      handlers.stop()
    })

    expect(onStop).toHaveBeenCalledTimes(1)
    expect(mediaSession.playbackState).toBe('none')
    expect(metadata).toBeNull()
  })

  it('clears stop handler on unmount', () => {
    const { unmount } = renderMediaSession()

    expect(typeof handlers.stop).toBe('function')
    unmount()
    expect(handlers.stop).toBeNull()
  })

  it('syncs playbackState to playing or paused', () => {
    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useMediaSession({
          currentTrack: makeTrack(),
          isPlaying,
          progress: 30,
          duration: 180,
          setIsPlaying,
          next,
          prev,
          seekTo,
          onStop,
        }),
      { initialProps: { isPlaying: true } },
    )

    expect(mediaSession.playbackState).toBe('playing')

    rerender({ isPlaying: false })
    expect(mediaSession.playbackState).toBe('paused')
  })
})
