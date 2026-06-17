import { useState, useRef, useEffect, useCallback } from 'react'
import { parseBlob } from 'music-metadata-browser'
import {
  getAllTracks,
  putTrack,
  deleteTrack,
  getAllPlaylists,
  putPlaylist,
  deletePlaylist,
  clearLibrary as clearLibraryDb,
  trackToRecord,
  requestPersistentStorage,
  isQuotaError,
} from '../libraryDb.js'
import { METADATA_CONCURRENCY } from '../constants.js'
import { isAudioFile, probeDuration } from '../utils/audio.js'
import { prettyName } from '../utils/format.js'
import { mapWithConcurrency } from '../utils/async.js'

export function useMusicLibrary({ registerUrl, revokeUrl }) {
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const [libraryReady, setLibraryReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const probedDurationRef = useRef(new Set())
  const albumBackfillQueueRef = useRef(new Set())
  const albumBackfillAttemptedRef = useRef(new Set())

  const persistTrack = useCallback(async (track) => {
    try {
      await putTrack(trackToRecord(track))
      await requestPersistentStorage()
    } catch (err) {
      if (isQuotaError(err)) {
        setStorageError('Storage full — remove some songs or free device space.')
      }
    }
  }, [])

  const parseTrackMetadata = useCallback(
    async (track) => {
      let updated = { ...track }
      try {
        const metadata = await parseBlob(track.file, { duration: true })
        const { common, format } = metadata
        let cover = null
        let coverBlob = null
        let coverMime = null
        if (common.picture?.[0]) {
          const pic = common.picture[0]
          coverBlob = new Blob([pic.data], { type: pic.format })
          coverMime = pic.format
          cover = registerUrl(URL.createObjectURL(coverBlob))
        }
        let trackDuration = format.duration || 0
        if (!trackDuration) {
          trackDuration = await probeDuration(track.file)
        }
        updated = {
          ...track,
          ...(track.metadataEdited
            ? {}
            : {
                title: common.title || track.title,
                artist: common.artist || track.artist,
                album: common.album || track.album,
              }),
          cover,
          coverBlob,
          coverMime,
          duration: trackDuration,
        }
        setTracks((prev) =>
          prev.map((t) => {
            if (t.id !== track.id) return t
            if (t.cover) revokeUrl(t.cover)
            return updated
          }),
        )
      } catch {
        // Ignore files we can't read tags from; filename fallback is fine.
      }
      if (!updated.duration) {
        const trackDuration = await probeDuration(track.file)
        if (trackDuration) {
          updated = { ...updated, duration: trackDuration }
          setTracks((prev) => prev.map((t) => (t.id === track.id ? updated : t)))
        }
      }
      await persistTrack(updated)
    },
    [registerUrl, revokeUrl, persistTrack],
  )

  const addFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList).filter(isAudioFile)
      if (files.length === 0) return

      setLoading(true)
      const baseIndex = tracks.length
      const newTracks = files.map((file, i) => ({
        id: `${Date.now()}-${baseIndex + i}-${file.name}`,
        file,
        url: registerUrl(URL.createObjectURL(file)),
        title: prettyName(file.name),
        artist: 'Unknown artist',
        album: 'Unknown album',
        cover: null,
        coverBlob: null,
        coverMime: null,
        duration: 0,
        addedAt: Date.now() + i,
        favorite: false,
      }))

      setTracks((prev) => {
        const merged = [...prev, ...newTracks]
        return merged
      })

      await mapWithConcurrency(newTracks, METADATA_CONCURRENCY, (track) => parseTrackMetadata(track))
      setLoading(false)
    },
    [tracks.length, registerUrl, parseTrackMetadata],
  )

  const removeTrack = useCallback(
    async (id, { currentIndex, setCurrentIndex, setIsPlaying }) => {
      const index = tracks.findIndex((t) => t.id === id)
      if (index === -1) return
      const track = tracks[index]
      revokeUrl(track.url)
      if (track.cover) revokeUrl(track.cover)

      const nextTracks = tracks.filter((t) => t.id !== id)
      setTracks(nextTracks)

      const affectedPlaylists = playlists.filter((p) => p.trackIds.includes(id))
      if (affectedPlaylists.length > 0) {
        setPlaylists((prev) =>
          prev.map((p) =>
            p.trackIds.includes(id)
              ? { ...p, trackIds: p.trackIds.filter((tid) => tid !== id) }
              : p,
          ),
        )
        await Promise.all(
          affectedPlaylists.map((p) =>
            putPlaylist({ ...p, trackIds: p.trackIds.filter((tid) => tid !== id) }),
          ),
        )
      }

      if (currentIndex >= 0) {
        if (index < currentIndex) {
          setCurrentIndex(currentIndex - 1)
        } else if (index === currentIndex) {
          setIsPlaying(false)
          setCurrentIndex(nextTracks.length === 0 ? -1 : Math.min(currentIndex, nextTracks.length - 1))
        }
      }

      try {
        await deleteTrack(id)
      } catch {
        // Library already updated in memory.
      }
    },
    [tracks, revokeUrl, playlists],
  )

  const persistPlaylist = useCallback(async (playlist) => {
    try {
      await putPlaylist(playlist)
      await requestPersistentStorage()
    } catch (err) {
      if (isQuotaError(err)) {
        setStorageError('Storage full — remove some songs or free device space.')
      }
    }
  }, [])

  const createPlaylist = useCallback(
    async (name) => {
      const trimmed = name.trim()
      if (!trimmed) return null
      const playlist = {
        id: `playlist-${Date.now()}`,
        name: trimmed,
        trackIds: [],
        createdAt: Date.now(),
      }
      setPlaylists((prev) => [...prev, playlist].sort((a, b) => a.name.localeCompare(b.name)))
      await persistPlaylist(playlist)
      return playlist
    },
    [persistPlaylist],
  )

  const removePlaylist = useCallback(
    async (id, setSelectedPlaylistId, selectedPlaylistId) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
      if (selectedPlaylistId === id) setSelectedPlaylistId(null)
      try {
        await deletePlaylist(id)
      } catch {
        // In-memory state already updated.
      }
    },
    [],
  )

  const addTrackToPlaylist = useCallback(
    async (playlistId, trackId) => {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist || playlist.trackIds.includes(trackId)) return
      const updated = { ...playlist, trackIds: [...playlist.trackIds, trackId] }
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
      await persistPlaylist(updated)
    },
    [playlists, persistPlaylist],
  )

  const removeTrackFromPlaylist = useCallback(
    async (playlistId, trackId) => {
      const playlist = playlists.find((p) => p.id === playlistId)
      if (!playlist) return
      const updated = { ...playlist, trackIds: playlist.trackIds.filter((tid) => tid !== trackId) }
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
      await persistPlaylist(updated)
    },
    [playlists, persistPlaylist],
  )

  const toggleFavorite = useCallback(async (id) => {
    const track = tracks.find((t) => t.id === id)
    if (!track) return
    const updated = { ...track, favorite: !track.favorite }
    setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    try {
      await putTrack(trackToRecord(updated))
    } catch {
      // In-memory state already updated.
    }
  }, [tracks])

  const updateTrackMetadata = useCallback(
    async (id, { title, artist, album }) => {
      const track = tracks.find((t) => t.id === id)
      if (!track) return
      const trimmedTitle = title.trim()
      if (!trimmedTitle) return
      const trimmedArtist = artist.trim()
      const trimmedAlbum = album.trim()
      const updated = {
        ...track,
        title: trimmedTitle,
        artist: trimmedArtist || 'Unknown artist',
        album: trimmedAlbum || 'Unknown album',
        metadataEdited: true,
      }
      albumBackfillQueueRef.current.delete(id)
      setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      try {
        await putTrack(trackToRecord(updated))
      } catch {
        // In-memory state already updated.
      }
    },
    [tracks],
  )

  const clearLibrary = useCallback(async () => {
    tracks.forEach((track) => {
      revokeUrl(track.url)
      if (track.cover) revokeUrl(track.cover)
    })
    setTracks([])
    setPlaylists([])
    probedDurationRef.current.clear()
    albumBackfillQueueRef.current.clear()
    albumBackfillAttemptedRef.current.clear()
    try {
      await clearLibraryDb()
    } catch {
      // In-memory state already updated.
    }
  }, [tracks, revokeUrl])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [records, savedPlaylists] = await Promise.all([getAllTracks(), getAllPlaylists()])
        if (cancelled) return
        const restored = records.map((record) => {
          if (record.album == null) albumBackfillQueueRef.current.add(record.id)
          const file = new File([record.audioBlob], record.fileName, { type: record.mimeType })
          const url = registerUrl(URL.createObjectURL(file))
          const cover = record.coverBlob
            ? registerUrl(URL.createObjectURL(record.coverBlob))
            : null
          return {
            id: record.id,
            file,
            url,
            title: record.title,
            artist: record.artist,
            album: record.album ?? 'Unknown album',
            cover,
            coverBlob: record.coverBlob ?? null,
            coverMime: record.coverMime ?? null,
            duration: record.duration,
            addedAt: record.addedAt,
            favorite: record.favorite ?? false,
            metadataEdited: record.metadataEdited ?? false,
          }
        })
        setTracks(restored)
        setPlaylists(savedPlaylists)
      } catch {
        // IndexedDB unavailable — start with an empty library.
      } finally {
        if (!cancelled) setLibraryReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [registerUrl])

  useEffect(() => {
    if (!libraryReady) return
    const missing = tracks.filter((t) => !t.duration && !probedDurationRef.current.has(t.id))
    if (missing.length === 0) return

    let cancelled = false
    missing.forEach((t) => probedDurationRef.current.add(t.id))

    ;(async () => {
      await mapWithConcurrency(missing, 3, async (track) => {
        if (cancelled) return
        const duration = await probeDuration(track.file)
        if (!duration || cancelled) return
        const updated = { ...track, duration }
        setTracks((prev) => prev.map((t) => (t.id === track.id ? updated : t)))
        await persistTrack(updated)
      })
    })()

    return () => {
      cancelled = true
    }
  }, [libraryReady, tracks, persistTrack])

  useEffect(() => {
    if (!libraryReady) return
    const missing = tracks.filter(
      (t) =>
        albumBackfillQueueRef.current.has(t.id) &&
        !albumBackfillAttemptedRef.current.has(t.id),
    )
    if (missing.length === 0) return

    let cancelled = false
    missing.forEach((t) => albumBackfillAttemptedRef.current.add(t.id))

    ;(async () => {
      await mapWithConcurrency(missing, METADATA_CONCURRENCY, async (track) => {
        if (cancelled) return
        await parseTrackMetadata(track)
        albumBackfillQueueRef.current.delete(track.id)
      })
    })()

    return () => {
      cancelled = true
    }
  }, [libraryReady, tracks, parseTrackMetadata])

  return {
    tracks,
    playlists,
    loading,
    libraryReady,
    storageError,
    setStorageError,
    addFiles,
    removeTrack,
    createPlaylist,
    removePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    toggleFavorite,
    updateTrackMetadata,
    clearLibrary,
  }
}
