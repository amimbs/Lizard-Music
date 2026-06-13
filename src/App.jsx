import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
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
} from './icons.jsx'
import {
  getAllTracks,
  putTrack,
  deleteTrack,
  trackToRecord,
  requestPersistentStorage,
  isQuotaError,
} from './libraryDb.js'
import { useInstallPrompt } from './useInstallPrompt.js'

const AUDIO_EXT = ['.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg', '.oga', '.opus', '.webm', '.weba']
const METADATA_CONCURRENCY = 5
const TRACK_ROW_HEIGHT = 60
const TRACK_ROW_HEIGHT_MOBILE = 56

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

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

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
      const metadata = await parseBlob(track.file, { duration: false })
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
      updated = {
        ...track,
        title: common.title || track.title,
        artist: common.artist || track.artist,
        album: common.album || '',
        cover,
        coverBlob,
        coverMime,
        duration: format.duration || 0,
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
      album: '',
      cover: null,
      coverBlob: null,
      coverMime: null,
      duration: 0,
      addedAt: Date.now() + i,
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
  }, [tracks, currentIndex, revokeUrl])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    setIsPlaying((p) => !p)
  }, [currentTrack])

  const buildShuffleOrder = useCallback((length, exclude) => {
    const order = Array.from({ length }, (_, i) => i).filter((i) => i !== exclude)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    return exclude >= 0 ? [exclude, ...order] : order
  }, [])

  const next = useCallback((auto = false) => {
    if (tracks.length === 0) return
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
        order = buildShuffleOrder(tracks.length, -1)
        shuffleOrderRef.current = order
        playIndex(order[0])
        return
      }
      playIndex(order[pos + 1])
      return
    }
    if (currentIndex + 1 < tracks.length) {
      playIndex(currentIndex + 1)
    } else if (repeat === 'all') {
      playIndex(0)
    } else {
      setIsPlaying(false)
    }
  }, [tracks.length, repeat, shuffle, currentIndex, playIndex, buildShuffleOrder])

  const prev = useCallback(() => {
    if (tracks.length === 0) return
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
    if (currentIndex - 1 >= 0) {
      playIndex(currentIndex - 1)
    } else if (repeat === 'all') {
      playIndex(tracks.length - 1)
    }
  }, [tracks.length, shuffle, currentIndex, repeat, playIndex])

  const seekTo = useCallback((time) => {
    const a = audioRef.current
    if (!a || time == null || Number.isNaN(time)) return
    a.currentTime = time
    setProgress(time)
  }, [])

  // Reset shuffle order when toggled on.
  useEffect(() => {
    if (shuffle) {
      shuffleOrderRef.current = buildShuffleOrder(tracks.length, currentIndex)
    }
  }, [shuffle, tracks.length, currentIndex, buildShuffleOrder])

  // Restore library from IndexedDB on startup.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const records = await getAllTracks()
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
            album: record.album,
            cover,
            coverBlob: record.coverBlob ?? null,
            coverMime: record.coverMime ?? null,
            duration: record.duration,
            addedAt: record.addedAt,
          }
        })
        setTracks(restored)
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
      album: currentTrack.album,
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

  const filtered = useMemo(() => {
    if (!search.trim()) return tracks.map((t, i) => ({ track: t, index: i }))
    const q = search.toLowerCase()
    return tracks
      .map((t, i) => ({ track: t, index: i }))
      .filter(
        ({ track }) =>
          track.title.toLowerCase().includes(q) ||
          track.artist.toLowerCase().includes(q) ||
          track.album.toLowerCase().includes(q),
      )
  }, [tracks, search])

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
    count: filtered.length,
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
  const { showBanner, showManualHint, install, dismiss } = useInstallPrompt()

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon"><IconMusic /></span>
          <span className="brand-name">Local Music</span>
        </div>
        <div className="search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search your library"
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
        ) : !hasTracks ? (
          <EmptyState
            onPickFiles={() => fileInputRef.current?.click()}
            onPickFolder={() => folderInputRef.current?.click()}
          />
        ) : (
          <div className="playlist">
            <div className="playlist-head">
              <span className="col-num">#</span>
              <span className="col-title">Title</span>
              <span className="col-album">Album</span>
              <span className="col-dur">Time</span>
              <span className="col-actions" aria-hidden="true" />
            </div>
            <div
              className="playlist-body playlist-virtual"
              style={{ height: filtered.length ? `${virtualizer.getTotalSize()}px` : undefined }}
            >
              {filtered.length === 0 ? (
                <div className="no-results">No tracks match “{search}”.</div>
              ) : (
                virtualizer.getVirtualItems().map((virtualRow) => {
                  const { track, index } = filtered[virtualRow.index]
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
                        index={index}
                        isCurrent={index === currentIndex}
                        isPlaying={isPlaying && index === currentIndex}
                        onPlay={() => (index === currentIndex ? togglePlay() : playIndex(index))}
                        onRemove={() => removeTrack(track.id)}
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
    </div>
  )
}

const TrackRow = memo(function TrackRow({ track, index, isCurrent, isPlaying, onPlay, onRemove }) {
  const handleRowClick = (e) => {
    if (e.target.closest('button')) return
    onPlay()
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    onRemove()
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
            <span className="num">{index + 1}</span>
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
      <div className="col-album" title={track.album}>{track.album || '—'}</div>
      <div className="col-dur">{track.duration ? formatTime(track.duration) : '—'}</div>
      <button
        type="button"
        className="col-actions remove-btn"
        onClick={handleRemove}
        aria-label="Remove from library"
      >
        <IconTrash />
      </button>
    </div>
  )
})

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
