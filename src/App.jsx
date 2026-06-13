import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
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
} from './icons.jsx'

const AUDIO_EXT = ['.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg', '.oga', '.opus', '.webm', '.weba']

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

  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const shuffleOrderRef = useRef([])

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null

  // Add files to the playlist and parse metadata in the background.
  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter(isAudioFile)
    if (files.length === 0) return

    setLoading(true)
    const baseIndex = tracks.length
    const newTracks = files.map((file, i) => ({
      id: `${Date.now()}-${baseIndex + i}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
      title: prettyName(file.name),
      artist: 'Unknown artist',
      album: '',
      cover: null,
      duration: 0,
    }))

    setTracks((prev) => {
      const merged = [...prev, ...newTracks]
      if (prev.length === 0) setCurrentIndex(0)
      return merged
    })

    // Parse tags lazily so the UI stays responsive.
    for (const track of newTracks) {
      try {
        const metadata = await parseBlob(track.file, { duration: false })
        const { common, format } = metadata
        let cover = null
        if (common.picture && common.picture[0]) {
          const pic = common.picture[0]
          const blob = new Blob([pic.data], { type: pic.format })
          cover = URL.createObjectURL(blob)
        }
        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id
              ? {
                  ...t,
                  title: common.title || t.title,
                  artist: common.artist || t.artist,
                  album: common.album || '',
                  cover,
                  duration: format.duration || 0,
                }
              : t,
          ),
        )
      } catch {
        // Ignore files we can't read tags from; filename fallback is fine.
      }
    }
    setLoading(false)
  }, [tracks.length])

  const playIndex = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

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

  // Reset shuffle order when toggled on.
  useEffect(() => {
    if (shuffle) {
      shuffleOrderRef.current = buildShuffleOrder(tracks.length, currentIndex)
    }
  }, [shuffle, tracks.length, currentIndex, buildShuffleOrder])

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

  // Media Session API for OS-level media keys.
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
  }, [currentTrack, next, prev])

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
    const a = audioRef.current
    const value = Number(e.target.value)
    if (a) {
      a.currentTime = value
      setProgress(value)
    }
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

  const cycleRepeat = () => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
  }

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      tracks.forEach((t) => {
        URL.revokeObjectURL(t.url)
        if (t.cover) URL.revokeObjectURL(t.cover)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasTracks = tracks.length > 0

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
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            <IconFile /> Add files
          </button>
          <button className="btn primary" onClick={() => folderInputRef.current?.click()}>
            <IconFolder /> Add folder
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

      <main className="content">
        {!hasTracks ? (
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
            </div>
            <div className="playlist-body">
              {filtered.map(({ track, index }) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrent={index === currentIndex}
                  isPlaying={isPlaying && index === currentIndex}
                  onPlay={() => (index === currentIndex ? togglePlay() : playIndex(index))}
                />
              ))}
              {filtered.length === 0 && (
                <div className="no-results">No tracks match “{search}”.</div>
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
            >
              <IconShuffle />
            </button>
            <button className="ctrl" onClick={prev} title="Previous (Shift+Left)">
              <IconPrev />
            </button>
            <button className="ctrl play" onClick={togglePlay} title="Play/Pause (Space)">
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="ctrl" onClick={() => next()} title="Next (Shift+Right)">
              <IconNext />
            </button>
            <button
              className={`ctrl ${repeat !== 'off' ? 'active' : ''}`}
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
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
              style={{ '--pct': `${duration ? (progress / duration) * 100 : 0}%` }}
            />
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume">
          <button className="ctrl" onClick={() => setMuted((m) => !m)} title="Mute">
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

function TrackRow({ track, index, isCurrent, isPlaying, onPlay }) {
  return (
    <div className={`track ${isCurrent ? 'current' : ''}`} onDoubleClick={onPlay}>
      <button className="col-num" onClick={onPlay}>
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
          {track.cover ? <img src={track.cover} alt="" /> : <IconMusic />}
        </div>
        <div className="title-meta">
          <div className="t-title" title={track.title}>{track.title}</div>
          <div className="t-artist" title={track.artist}>{track.artist}</div>
        </div>
      </div>
      <div className="col-album" title={track.album}>{track.album || '—'}</div>
      <div className="col-dur">{track.duration ? formatTime(track.duration) : '—'}</div>
    </div>
  )
}

function EmptyState({ onPickFiles, onPickFolder }) {
  return (
    <div className="empty">
      <div className="empty-icon"><IconMusic /></div>
      <h1>Your library is empty</h1>
      <p>Pick individual songs or a whole folder of music from your computer to start listening.</p>
      <div className="empty-actions">
        <button className="btn" onClick={onPickFiles}><IconFile /> Add files</button>
        <button className="btn primary" onClick={onPickFolder}><IconFolder /> Add folder</button>
      </div>
      <p className="hint">Everything stays on your machine — nothing is uploaded.</p>
    </div>
  )
}
