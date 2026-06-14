import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { parseBlob } from 'music-metadata-browser'
import './App.css'
import {
  IconPlay,
  IconPause,
  IconNext,
  IconPrev,
  IconShuffle,
  IconRepeat,
  IconRepeatOne,
  IconVolume,
  IconVolumeMute,
  IconMusic,
  IconFolder,
  IconFile,
  IconSearch,
  IconTrash,
  IconHeart,
  IconHeartFilled,
  IconPlaylist,
  IconPlaylistAdd,
  IconPlus,
  IconBack,
  IconMenu,
} from './icons.jsx'
import {
  getAllTracks,
  putTrack,
  deleteTrack,
  getAllPlaylists,
  putPlaylist,
  deletePlaylist,
  trackToRecord,
  requestPersistentStorage,
  isQuotaError,
} from './libraryDb.js'
import { useInstallPrompt } from './useInstallPrompt.js'

const AUDIO_EXT = ['.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg', '.oga', '.opus', '.webm', '.weba']
const METADATA_CONCURRENCY = 5
const TRACK_ROW_HEIGHT = 60
const TRACK_ROW_HEIGHT_MOBILE = 56
const RECENT_MS = 7 * 24 * 60 * 60 * 1000

function isAudioFile(file) {
  const name = file.name.toLowerCase()
  if (file.type && file.type.startsWith('audio/')) return true
  return AUDIO_EXT.some((ext) => name.endsWith(ext))
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function prettyName(filename) {
  return filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
}

function sortByTitle(a, b) {
  const titleCmp = a.track.title.toLowerCase().localeCompare(b.track.title.toLowerCase())
  if (titleCmp !== 0) return titleCmp
  return a.track.artist.toLowerCase().localeCompare(b.track.artist.toLowerCase())
}

const VIEW_TITLES = {
  songs: 'Songs',
  recent: 'Recently Added',
  favorites: 'Favorites',
  playlists: 'Playlists',
}

function switchView(setView, setSelectedPlaylistId, setSearch, nextView) {
  setView(nextView)
  if (nextView !== 'playlists') setSelectedPlaylistId(null)
  setSearch('')
}

async function mapWithConcurrency(items, limit, fn) {
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      await fn(items[current], current)
    }
  })
  await Promise.all(workers)
}

function probeDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const duration = audio.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(duration) ? duration : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
    audio.src = url
  })
}

export default function App() {
  const [tracks, setTracks] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off') // off | all | one
  const [search, setSearch] = useState('')
  const [view, setView] = useState('songs') // songs | recent | favorites | playlists
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [loading, setLoading] = useState(false)
  const [libraryReady, setLibraryReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [rowHeight, setRowHeight] = useState(TRACK_ROW_HEIGHT)

  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const shuffleOrderRef = useRef([])
  const contentRef = useRef(null)
  const urlRegistryRef = useRef(new Set())
  const probedDurationRef = useRef(new Set())

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  )
  const addToPlaylistTrack = addToPlaylistTrackId
    ? tracks.find((t) => t.id === addToPlaylistTrackId) ?? null
    : null

  const registerUrl = useCallback((url) => {
    if (url) urlRegistryRef.current.add(url)
    return url
  }, [])

  const revokeUrl = useCallback((url) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urlRegistryRef.current.delete(url)
  }, [])

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

  const parseTrackMetadata = useCallback(async (track) => {
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
        title: common.title || track.title,
        artist: common.artist || track.artist,
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
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? updated : t)),
        )
      }
    }
    await persistTrack(updated)
  }, [registerUrl, revokeUrl, persistTrack])

  // Add files to the playlist and parse metadata in the background.
  const addFiles = useCallback(async (fileList) => {
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
      cover: null,
      coverBlob: null,
      coverMime: null,
      duration: 0,
      addedAt: Date.now() + i,
      favorite: false,
    }))

    setTracks((prev) => {
      const merged = [...prev, ...newTracks]
      if (prev.length === 0) setCurrentIndex(0)
      return merged
    })

    await mapWithConcurrency(newTracks, METADATA_CONCURRENCY, (track) => parseTrackMetadata(track))
    setLoading(false)
  }, [tracks.length, registerUrl, parseTrackMetadata])

  const playIndex = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

  const removeTrack = useCallback(async (id) => {
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
  }, [tracks, currentIndex, revokeUrl, playlists])

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

  const createPlaylist = useCallback(async (name) => {
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
  }, [persistPlaylist])

  const removePlaylist = useCallback(async (id) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id))
    if (selectedPlaylistId === id) setSelectedPlaylistId(null)
    try {
      await deletePlaylist(id)
    } catch {
      // In-memory state already updated.
    }
  }, [selectedPlaylistId])

  const addTrackToPlaylist = useCallback(async (playlistId, trackId) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist || playlist.trackIds.includes(trackId)) return
    const updated = { ...playlist, trackIds: [...playlist.trackIds, trackId] }
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    await persistPlaylist(updated)
  }, [playlists, persistPlaylist])

  const removeTrackFromPlaylist = useCallback(async (playlistId, trackId) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return
    const updated = { ...playlist, trackIds: playlist.trackIds.filter((tid) => tid !== trackId) }
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    await persistPlaylist(updated)
  }, [playlists, persistPlaylist])

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

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    setIsPlaying((p) => !p)
  }, [currentTrack])

  const viewList = useMemo(() => {
    const indexed = tracks.map((t, i) => ({ track: t, index: i }))
    if (view === 'playlists' && selectedPlaylistId) {
      const playlist = playlists.find((p) => p.id === selectedPlaylistId)
      if (!playlist) return []
      const indexById = new Map(tracks.map((t, i) => [t.id, i]))
      return playlist.trackIds
        .map((id) => {
          const index = indexById.get(id)
          if (index === undefined) return null
          return { track: tracks[index], index }
        })
        .filter(Boolean)
    }
    if (view === 'songs' || view === 'favorites') {
      const list = view === 'favorites' ? indexed.filter(({ track }) => track.favorite) : indexed
      return list.sort(sortByTitle)
    }
    if (view === 'recent') {
      const cutoff = Date.now() - RECENT_MS
      return indexed
        .filter(({ track }) => track.addedAt >= cutoff)
        .sort((a, b) => b.track.addedAt - a.track.addedAt)
    }
    return []
  }, [tracks, view, selectedPlaylistId, playlists])

  const displayedPlaylists = useMemo(() => {
    if (!search.trim()) return playlists
    const q = search.toLowerCase()
    return playlists.filter((p) => p.name.toLowerCase().includes(q))
  }, [playlists, search])

  const displayed = useMemo(() => {
    if (view === 'playlists' && !selectedPlaylistId) return []
    if (!search.trim()) return viewList
    const q = search.toLowerCase()
    return viewList.filter(
      ({ track }) =>
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q),
    )
  }, [viewList, search, view, selectedPlaylistId])

  const playOrder = useMemo(() => displayed.map((d) => d.index), [displayed])

  const buildShuffleOrder = useCallback((order, exclude) => {
    const shuffled = order.filter((i) => i !== exclude)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return exclude >= 0 ? [exclude, ...shuffled] : shuffled
  }, [])

  const next = useCallback((auto = false) => {
    if (playOrder.length === 0) return
    if (repeat === 'one' && auto) {
      const a = audioRef.current
      if (a) {
        a.currentTime = 0
        a.play()
      }
      return
    }
    if (shuffle) {
      let order = shuffleOrderRef.current
      const pos = order.indexOf(currentIndex)
      if (pos === -1 || pos + 1 >= order.length) {
        order = buildShuffleOrder(playOrder, -1)
        shuffleOrderRef.current = order
        playIndex(order[0])
        return
      }
      playIndex(order[pos + 1])
      return
    }
    const pos = playOrder.indexOf(currentIndex)
    if (pos !== -1 && pos + 1 < playOrder.length) {
      playIndex(playOrder[pos + 1])
    } else if (pos !== -1 && repeat === 'all') {
      playIndex(playOrder[0])
    } else if (pos === -1) {
      playIndex(playOrder[0])
    } else {
      setIsPlaying(false)
    }
  }, [playOrder, repeat, shuffle, currentIndex, playIndex, buildShuffleOrder])

  const prev = useCallback(() => {
    if (playOrder.length === 0) return
    const a = audioRef.current
    if (a && a.currentTime > 3) {
      a.currentTime = 0
      return
    }
    if (shuffle) {
      const order = shuffleOrderRef.current
      const pos = order.indexOf(currentIndex)
      if (pos > 0) {
        playIndex(order[pos - 1])
        return
      }
    }
    const pos = playOrder.indexOf(currentIndex)
    if (pos > 0) {
      playIndex(playOrder[pos - 1])
    } else if (pos === 0 && repeat === 'all') {
      playIndex(playOrder[playOrder.length - 1])
    } else if (pos === -1) {
      playIndex(playOrder[playOrder.length - 1])
    }
  }, [playOrder, shuffle, currentIndex, repeat, playIndex])

  const seekTo = useCallback((time) => {
    const a = audioRef.current
    if (!a || time == null || Number.isNaN(time)) return
    a.currentTime = time
    setProgress(time)
  }, [])

  // Reset shuffle order when toggled on.
  useEffect(() => {
    if (shuffle) {
      shuffleOrderRef.current = buildShuffleOrder(playOrder, currentIndex)
    }
  }, [shuffle, playOrder, currentIndex, buildShuffleOrder])

  // Restore library from IndexedDB on startup.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [records, savedPlaylists] = await Promise.all([getAllTracks(), getAllPlaylists()])
        if (cancelled) return
        const restored = records.map((record) => {
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
            cover,
            coverBlob: record.coverBlob ?? null,
            coverMime: record.coverMime ?? null,
            duration: record.duration,
            addedAt: record.addedAt,
            favorite: record.favorite ?? false,
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

  // Backfill missing durations for tracks imported before duration parsing was enabled.
  useEffect(() => {
    if (!libraryReady) return
    const missing = tracks.filter(
      (t) => !t.duration && !probedDurationRef.current.has(t.id),
    )
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

  // Sync the <audio> element with the current track + playing state.
  useEffect(() => {
    const a = audioRef.current
    if (!a || !currentTrack) return
    if (a.src !== currentTrack.url) {
      a.src = currentTrack.url
    }
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false))
    } else {
      a.pause()
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = muted ? 0 : volume
  }, [volume, muted])

  // Media Session API for OS-level media keys and lock-screen controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.cover ? [{ src: currentTrack.cover }] : [],
    })

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true))
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false))
    navigator.mediaSession.setActionHandler('nexttrack', () => next())
    navigator.mediaSession.setActionHandler('previoustrack', () => prev())
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seekTo(details.seekTime)
    })

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('seekto', null)
    }
  }, [currentTrack, next, prev, seekTo])

  // Keep lock-screen scrubber in sync.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack || !duration) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(progress, duration),
      })
    } catch {
      // setPositionState not supported in this browser.
    }
  }, [currentTrack, progress, duration])

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        next()
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, next, prev])

  const onTimeUpdate = () => {
    const a = audioRef.current
    if (a) setProgress(a.currentTime)
  }
  const onLoadedMetadata = () => {
    const a = audioRef.current
    if (a) setDuration(a.duration)
  }
  const onSeek = (e) => {
    seekTo(Number(e.target.value))
  }

  useEffect(() => {
    const updateRowHeight = () => {
      setRowHeight(window.innerWidth <= 760 ? TRACK_ROW_HEIGHT_MOBILE : TRACK_ROW_HEIGHT)
    }
    updateRowHeight()
    window.addEventListener('resize', updateRowHeight)
    return () => window.removeEventListener('resize', updateRowHeight)
  }, [])

  const estimateRowSize = useCallback(() => rowHeight, [rowHeight])

  const virtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: () => contentRef.current,
    estimateSize: estimateRowSize,
    overscan: 8,
  })

  const cycleRepeat = () => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
  }

  // Clean up object URLs on unmount.
  useEffect(() => {
    const registry = urlRegistryRef.current
    return () => {
      registry.forEach((url) => URL.revokeObjectURL(url))
      registry.clear()
    }
  }, [])

  const hasTracks = tracks.length > 0
  const recentEmpty = view === 'recent' && viewList.length === 0 && !search.trim()
  const favoritesEmpty = view === 'favorites' && viewList.length === 0 && !search.trim()
  const playlistDetailEmpty =
    view === 'playlists' && selectedPlaylistId && viewList.length === 0 && !search.trim()
  const searchPlaceholder =
    view === 'playlists' && !selectedPlaylistId
      ? 'Search playlists'
      : view === 'playlists'
        ? 'Search this playlist'
        : 'Search your library'
  const { showBanner, showManualHint, install, dismiss } = useInstallPrompt()

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon"><IconMusic /></span>
          <span className="brand-name">Local Music</span>
        </div>
        <nav className="nav" aria-label="Library views">
          <button
            type="button"
            className={view === 'songs' ? 'active' : ''}
            onClick={() => switchView(setView, setSelectedPlaylistId, setSearch, 'songs')}
            aria-current={view === 'songs' ? 'page' : undefined}
          >
            Songs
          </button>
          <button
            type="button"
            className={view === 'recent' ? 'active' : ''}
            onClick={() => switchView(setView, setSelectedPlaylistId, setSearch, 'recent')}
            aria-current={view === 'recent' ? 'page' : undefined}
          >
            Recently Added
          </button>
          <button
            type="button"
            className={view === 'favorites' ? 'active' : ''}
            onClick={() => switchView(setView, setSelectedPlaylistId, setSearch, 'favorites')}
            aria-current={view === 'favorites' ? 'page' : undefined}
          >
            Favorites
          </button>
          <button
            type="button"
            className={view === 'playlists' ? 'active' : ''}
            onClick={() => switchView(setView, setSelectedPlaylistId, setSearch, 'playlists')}
            aria-current={view === 'playlists' ? 'page' : undefined}
          >
            Playlists
          </button>
        </nav>
        <div className="search">
          <IconSearch />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="actions">
          <button
            className="btn primary btn-icon-only"
            aria-label="Add files"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconFile /> <span className="btn-label">Add files</span>
          </button>
          <button
            className="btn btn-icon-only"
            aria-label="Add folder"
            onClick={() => folderInputRef.current?.click()}
          >
            <IconFolder /> <span className="btn-label">Add folder</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </header>

      {storageError && (
        <div className="storage-banner" role="alert">
          {storageError}
          <button type="button" onClick={() => setStorageError('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {(showBanner || showManualHint) && (
        <div className="install-banner">
          <div className="install-banner-text">
            {showBanner ? (
              <>
                <strong>Install Local Music</strong>
                <span>Add to your home screen for quick access.</span>
              </>
            ) : (
              <>
                <strong>Install this app</strong>
                <span>In Chrome, tap <span className="install-menu">⋮</span> → <strong>Install app</strong>.</span>
              </>
            )}
          </div>
          <div className="install-banner-actions">
            {showBanner && (
              <button type="button" className="btn primary install-btn" onClick={install}>
                Install
              </button>
            )}
            <button type="button" className="install-dismiss" onClick={dismiss} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      <main className="content" ref={contentRef}>
        {!libraryReady ? (
          <div className="restoring">
            <div className="restoring-icon"><IconMusic /></div>
            <p>Restoring your library…</p>
          </div>
        ) : view === 'playlists' && !selectedPlaylistId ? (
          <PlaylistsBrowser
            playlists={displayedPlaylists}
            newPlaylistName={newPlaylistName}
            onNewPlaylistNameChange={setNewPlaylistName}
            onCreatePlaylist={async () => {
              const created = await createPlaylist(newPlaylistName)
              if (created) setNewPlaylistName('')
            }}
            onOpenPlaylist={setSelectedPlaylistId}
            onDeletePlaylist={removePlaylist}
            hasSearch={!!search.trim()}
          />
        ) : !hasTracks ? (
          <EmptyState
            onPickFiles={() => fileInputRef.current?.click()}
            onPickFolder={() => folderInputRef.current?.click()}
          />
        ) : recentEmpty ? (
          <div className="view-empty">
            <div className="view-empty-icon"><IconMusic /></div>
            <h2>Nothing added in the last 7 days</h2>
            <p>Songs you add will show up here for a week. Browse all music on the Songs page.</p>
          </div>
        ) : favoritesEmpty ? (
          <div className="view-empty">
            <div className="view-empty-icon"><IconHeart /></div>
            <h2>No favorites yet</h2>
            <p>Tap the heart on any song to save it here.</p>
          </div>
        ) : playlistDetailEmpty ? (
          <div className="view-empty">
            <div className="view-empty-icon"><IconPlaylist /></div>
            <h2>This playlist is empty</h2>
            <p>Use the playlist button on any song to add it here.</p>
            <button type="button" className="btn page-back-btn" onClick={() => setSelectedPlaylistId(null)}>
              <IconBack /> Back to Playlists
            </button>
          </div>
        ) : (
          <div className="playlist">
            <div className="page-title">
              {view === 'playlists' && selectedPlaylistId && (
                <button
                  type="button"
                  className="page-back"
                  onClick={() => setSelectedPlaylistId(null)}
                  aria-label="Back to playlists"
                >
                  <IconBack />
                </button>
              )}
              <h1>
                {view === 'playlists' && selectedPlaylist
                  ? selectedPlaylist.name
                  : VIEW_TITLES[view]}
              </h1>
              <span className="page-count">
                {displayed.length} {displayed.length === 1 ? 'song' : 'songs'}
              </span>
            </div>
            <div className="playlist-head">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-dur">Time</span>
              <span className="col-actions" aria-hidden="true" />
            </div>
            <div
              className="playlist-body playlist-virtual"
              style={{ height: displayed.length ? `${virtualizer.getTotalSize()}px` : undefined }}
            >
              {displayed.length === 0 ? (
                <div className="no-results">No tracks match “{search}”.</div>
              ) : (
                virtualizer.getVirtualItems().map((virtualRow) => {
                  const { track, index } = displayed[virtualRow.index]
                  return (
                    <div
                      key={track.id}
                      className="playlist-virtual-row"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TrackRow
                        track={track}
                        displayIndex={virtualRow.index}
                        isCurrent={index === currentIndex}
                        isPlaying={isPlaying && index === currentIndex}
                        isFavorite={track.favorite}
                        onPlay={() => (index === currentIndex ? togglePlay() : playIndex(index))}
                        onToggleFavorite={() => toggleFavorite(track.id)}
                        onAddToPlaylist={() => setAddToPlaylistTrackId(track.id)}
                        onRemove={() =>
                          view === 'playlists' && selectedPlaylistId
                            ? removeTrackFromPlaylist(selectedPlaylistId, track.id)
                            : removeTrack(track.id)
                        }
                        removeLabel={
                          view === 'playlists' && selectedPlaylistId
                            ? 'Remove from playlist'
                            : 'Remove from library'
                        }
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="player">
        <div className="np">
          {currentTrack ? (
            <>
              <div className="np-cover">
                {currentTrack.cover ? (
                  <img src={currentTrack.cover} alt="" />
                ) : (
                  <div className="np-cover-fallback"><IconMusic /></div>
                )}
              </div>
              <div className="np-meta">
                <div className="np-title" title={currentTrack.title}>{currentTrack.title}</div>
                <div className="np-artist" title={currentTrack.artist}>{currentTrack.artist}</div>
              </div>
              <button
                type="button"
                className={`np-favorite ${currentTrack.favorite ? 'active' : ''}`}
                onClick={() => toggleFavorite(currentTrack.id)}
                aria-label={currentTrack.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {currentTrack.favorite ? <IconHeartFilled /> : <IconHeart />}
              </button>
            </>
          ) : (
            <div className="np-meta">
              <div className="np-title">{loading ? 'Loading…' : 'Nothing playing'}</div>
              <div className="np-artist">Add some music to get started</div>
            </div>
          )}
        </div>

        <div className="controls">
          <div className="control-buttons">
            <button
              className={`ctrl ${shuffle ? 'active' : ''}`}
              onClick={() => setShuffle((s) => !s)}
              title="Shuffle"
              aria-label="Shuffle"
            >
              <IconShuffle />
            </button>
            <button className="ctrl" onClick={prev} title="Previous (Shift+Left)" aria-label="Previous">
              <IconPrev />
            </button>
            <button className="ctrl play" onClick={togglePlay} title="Play/Pause (Space)" aria-label="Play or pause">
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="ctrl" onClick={() => next()} title="Next (Shift+Right)" aria-label="Next">
              <IconNext />
            </button>
            <button
              className={`ctrl ${repeat !== 'off' ? 'active' : ''}`}
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
              aria-label={`Repeat: ${repeat}`}
            >
              {repeat === 'one' ? <IconRepeatOne /> : <IconRepeat />}
            </button>
          </div>
          <div className="seek">
            <span className="time">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="0.1"
              value={progress}
              onChange={onSeek}
              aria-label="Seek"
              style={{ '--pct': `${duration ? (progress / duration) * 100 : 0}%` }}
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume">
          <button className="ctrl" onClick={() => setMuted((m) => !m)} title="Mute" aria-label="Mute">
            {muted || volume === 0 ? <IconVolumeMute /> : <IconVolume />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value))
              setMuted(false)
            }}
            aria-label="Volume"
            style={{ '--pct': `${(muted ? 0 : volume) * 100}%` }}
          />
        </div>
      </footer>

      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => next(true)}
      />

      {addToPlaylistTrackId && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          playlists={playlists}
          onSelect={async (playlistId) => {
            if (addToPlaylistTrackId) await addTrackToPlaylist(playlistId, addToPlaylistTrackId)
            setAddToPlaylistTrackId(null)
          }}
          onCreate={async (name) => {
            const created = await createPlaylist(name)
            if (created && addToPlaylistTrackId) {
              await addTrackToPlaylist(created.id, addToPlaylistTrackId)
            }
            setAddToPlaylistTrackId(null)
          }}
          onClose={() => setAddToPlaylistTrackId(null)}
        />
      )}
    </div>
  )
}

const TrackRow = memo(function TrackRow({
  track,
  displayIndex,
  isCurrent,
  isPlaying,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onRemove,
  removeLabel,
}) {
  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.track-menu-dropdown')) return
    onPlay()
  }

  return (
    <div
      className={`track ${isCurrent ? 'current' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay()
        }
      }}
    >
      <button className="col-num" onClick={onPlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <span className="eq"><i></i><i></i><i></i></span>
        ) : (
          <>
            <span className="num">{displayIndex + 1}</span>
            <span className="play-hover"><IconPlay /></span>
          </>
        )}
      </button>
      <div className="col-title">
        <div className="cover-sm">
          {track.cover ? <img src={track.cover} alt="" loading="lazy" /> : <IconMusic />}
        </div>
        <div className="title-meta">
          <div className="t-title" title={track.title}>{track.title}</div>
          <div className="t-artist" title={track.artist}>{track.artist}</div>
        </div>
      </div>
      <div className="col-dur">{track.duration ? formatTime(track.duration) : '—'}</div>
      <div className="col-actions track-actions">
        <TrackMenu
          isFavorite={isFavorite}
          removeLabel={removeLabel}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
})

const TRACK_MENU_WIDTH = 220

function TrackMenu({ isFavorite, removeLabel, onToggleFavorite, onAddToPlaylist, onRemove }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuHeight = menuRef.current?.offsetHeight ?? 148
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12
      const top = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6
      const left = Math.max(
        8,
        Math.min(rect.right - TRACK_MENU_WIDTH, window.innerWidth - TRACK_MENU_WIDTH - 8),
      )

      setPosition({ top, left })
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const handlePointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const runAction = (action) => (e) => {
    e.stopPropagation()
    setOpen(false)
    action()
  }

  return (
    <div className={`track-menu ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`track-menu-trigger ${isFavorite ? 'has-favorite' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((value) => !value)
        }}
        aria-label="Song actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconMenu />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="track-menu-dropdown"
            role="menu"
            style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${TRACK_MENU_WIDTH}px` }}
          >
            <button
              type="button"
              role="menuitem"
              className={`track-menu-item ${isFavorite ? 'active' : ''}`}
              onClick={runAction(onToggleFavorite)}
            >
              {isFavorite ? <IconHeartFilled /> : <IconHeart />}
              <span>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="track-menu-item"
              onClick={runAction(onAddToPlaylist)}
            >
              <IconPlaylistAdd />
              <span>Add to playlist</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="track-menu-item danger"
              onClick={runAction(onRemove)}
            >
              <IconTrash />
              <span>{removeLabel}</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

function PlaylistsBrowser({
  playlists,
  newPlaylistName,
  onNewPlaylistNameChange,
  onCreatePlaylist,
  onOpenPlaylist,
  onDeletePlaylist,
  hasSearch,
}) {
  const handleCreate = (e) => {
    e.preventDefault()
    onCreatePlaylist()
  }

  return (
    <div className="playlists-browser">
      <div className="page-title">
        <h1>Playlists</h1>
        <span className="page-count">
          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
        </span>
      </div>

      <form className="create-playlist" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New playlist name"
          value={newPlaylistName}
          onChange={(e) => onNewPlaylistNameChange(e.target.value)}
          aria-label="New playlist name"
        />
        <button type="submit" className="btn primary" disabled={!newPlaylistName.trim()}>
          <IconPlus /> Create
        </button>
      </form>

      {playlists.length === 0 ? (
        <div className="view-empty playlists-empty">
          <div className="view-empty-icon"><IconPlaylist /></div>
          <h2>{hasSearch ? 'No playlists match your search' : 'No playlists yet'}</h2>
          <p>
            {hasSearch
              ? 'Try a different search term.'
              : 'Create a playlist above, then add songs from your library.'}
          </p>
        </div>
      ) : (
        <ul className="playlist-cards">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                type="button"
                className="playlist-card"
                onClick={() => onOpenPlaylist(playlist.id)}
              >
                <span className="playlist-card-icon"><IconPlaylist /></span>
                <span className="playlist-card-meta">
                  <span className="playlist-card-name">{playlist.name}</span>
                  <span className="playlist-card-count">
                    {playlist.trackIds.length}{' '}
                    {playlist.trackIds.length === 1 ? 'song' : 'songs'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="playlist-card-delete"
                onClick={() => onDeletePlaylist(playlist.id)}
                aria-label={`Delete ${playlist.name}`}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddToPlaylistModal({ track, playlists, onSelect, onCreate, onClose }) {
  const [newName, setNewName] = useState('')

  const handleCreate = (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setNewName('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="add-to-playlist-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="add-to-playlist-title">Add to playlist</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {track && (
          <p className="modal-subtitle">
            {track.title} · {track.artist}
          </p>
        )}
        <form className="modal-create" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Create new playlist"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New playlist name"
          />
          <button type="submit" className="btn primary" disabled={!newName.trim()}>
            Create
          </button>
        </form>
        {playlists.length > 0 ? (
          <ul className="modal-playlist-list">
            {playlists.map((playlist) => {
              const alreadyAdded = track ? playlist.trackIds.includes(track.id) : false
              return (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className="modal-playlist-item"
                    disabled={alreadyAdded}
                    onClick={() => onSelect(playlist.id)}
                  >
                    <span className="modal-playlist-name">{playlist.name}</span>
                    <span className="modal-playlist-count">
                      {alreadyAdded
                        ? 'Already added'
                        : `${playlist.trackIds.length} ${playlist.trackIds.length === 1 ? 'song' : 'songs'}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="modal-empty">No playlists yet — create one above.</p>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onPickFiles, onPickFolder }) {
  return (
    <div className="empty">
      <div className="empty-icon"><IconMusic /></div>
      <h1>Your library is empty</h1>
      <p>Pick individual songs or a whole folder of music from your device to start listening.</p>
      <div className="empty-actions">
        <button className="btn primary" onClick={onPickFiles}><IconFile /> Add files</button>
        <button className="btn" onClick={onPickFolder}><IconFolder /> Add folder</button>
      </div>
      <p className="hint">Everything stays on your device — nothing is uploaded. Your library is saved locally between sessions.</p>
    </div>
  )
}
