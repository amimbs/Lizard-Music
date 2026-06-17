import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import * as libraryDb from '../libraryDb.js'
import { useMusicLibrary } from './useMusicLibrary.js'

vi.mock('../libraryDb.js', () => ({
  getAllTracks: vi.fn(),
  getAllPlaylists: vi.fn(),
  putTrack: vi.fn(),
  deleteTrack: vi.fn(),
  putPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  clearLibrary: vi.fn(),
  trackToRecord: vi.fn((track) => track),
  requestPersistentStorage: vi.fn(),
  isQuotaError: vi.fn(),
}))

function makeTrackRecord(id, title = 'Song') {
  const blob = new Blob(['audio'], { type: 'audio/mpeg' })
  return {
    id,
    fileName: `${title}.mp3`,
    mimeType: 'audio/mpeg',
    audioBlob: blob,
    title,
    artist: 'Artist',
    album: 'Unknown album',
    duration: 180,
    coverBlob: null,
    coverMime: null,
    addedAt: 1000,
    favorite: false,
  }
}

describe('useMusicLibrary', () => {
  const registerUrl = vi.fn((url) => url ?? 'blob:mock')
  const revokeUrl = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    libraryDb.getAllTracks.mockResolvedValue([
      makeTrackRecord('t1', 'One'),
      makeTrackRecord('t2', 'Two'),
    ])
    libraryDb.getAllPlaylists.mockResolvedValue([
      { id: 'p1', name: 'Road Trip', trackIds: ['t1', 't2'] },
    ])
    libraryDb.deletePlaylist.mockResolvedValue(undefined)
    libraryDb.deleteTrack.mockResolvedValue(undefined)
    libraryDb.clearLibrary.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function loadLibrary() {
    const hook = renderHook(() => useMusicLibrary({ registerUrl, revokeUrl }))
    await waitFor(() => expect(hook.result.current.libraryReady).toBe(true))
    return hook
  }

  describe('removePlaylist', () => {
    it('removes the playlist but keeps all tracks in the library', async () => {
      const { result } = await loadLibrary()

      expect(result.current.tracks).toHaveLength(2)
      expect(result.current.playlists).toHaveLength(1)

      const setSelectedPlaylistId = vi.fn()
      await act(async () => {
        await result.current.removePlaylist('p1', setSelectedPlaylistId, null)
      })

      expect(result.current.playlists).toHaveLength(0)
      expect(result.current.tracks).toHaveLength(2)
      expect(libraryDb.deletePlaylist).toHaveBeenCalledWith('p1')
      expect(libraryDb.deleteTrack).not.toHaveBeenCalled()
    })

    it('clears the selected playlist when deleting the open playlist', async () => {
      const { result } = await loadLibrary()
      const setSelectedPlaylistId = vi.fn()

      await act(async () => {
        await result.current.removePlaylist('p1', setSelectedPlaylistId, 'p1')
      })

      expect(setSelectedPlaylistId).toHaveBeenCalledWith(null)
    })
  })

  describe('removeTrack', () => {
    it('removes the track from the library and IndexedDB', async () => {
      const { result } = await loadLibrary()
      const playbackControls = {
        currentIndex: -1,
        setCurrentIndex: vi.fn(),
        setIsPlaying: vi.fn(),
      }

      await act(async () => {
        await result.current.removeTrack('t1', playbackControls)
      })

      expect(result.current.tracks.map((t) => t.id)).toEqual(['t2'])
      expect(libraryDb.deleteTrack).toHaveBeenCalledWith('t1')
      expect(libraryDb.deletePlaylist).not.toHaveBeenCalled()
    })
  })

  describe('clearLibrary', () => {
    it('removes all tracks and playlists from memory and storage', async () => {
      const { result } = await loadLibrary()

      await act(async () => {
        await result.current.clearLibrary()
      })

      expect(result.current.tracks).toHaveLength(0)
      expect(result.current.playlists).toHaveLength(0)
      expect(libraryDb.clearLibrary).toHaveBeenCalledOnce()
      expect(revokeUrl).toHaveBeenCalled()
    })
  })
})
