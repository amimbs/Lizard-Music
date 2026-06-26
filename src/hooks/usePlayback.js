import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { buildShuffleOrder } from '../utils/tracks.js'

export function usePlayback({ tracks, playOrder }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')

  const audioRef = useRef(null)
  const shuffleOrderRef = useRef([])

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const trackUrl = currentTrack?.url ?? null

  const playIndex = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => {
    if (currentIndex < 0 || !tracks[currentIndex]) return
    setIsPlaying((p) => !p)
  }, [currentIndex, tracks])

  const buildOrder = useCallback(
    (exclude) => buildShuffleOrder(playOrder, exclude),
    [playOrder],
  )

  const next = useCallback(
    (auto = false) => {
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
          order = buildOrder(-1)
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
    },
    [playOrder, repeat, shuffle, currentIndex, playIndex, buildOrder],
  )

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

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
  }, [])

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current
    if (a) setProgress(a.currentTime)
  }, [])

  const onLoadedMetadata = useCallback(() => {
    const a = audioRef.current
    if (a) setDuration(a.duration)
  }, [])

  const onPlay = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const onPause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const onSeek = useCallback(
    (e) => {
      seekTo(Number(e.target.value))
    },
    [seekTo],
  )

  useEffect(() => {
    if (shuffle) {
      shuffleOrderRef.current = buildOrder(currentIndex)
    }
  }, [shuffle, playOrder, currentIndex, buildOrder])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (!trackUrl) {
      if (a.src) {
        a.pause()
        a.removeAttribute('src')
        a.load()
      }
      return
    }
    if (a.src !== trackUrl) {
      a.src = trackUrl
    }
  }, [trackUrl])

  useEffect(() => {
    const a = audioRef.current
    if (!a || !trackUrl) return
    if (isPlaying) {
      a.play().catch(() => setIsPlaying(false))
    } else {
      a.pause()
    }
  }, [trackUrl, isPlaying])

  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = muted ? 0 : volume
  }, [volume, muted])

  const playbackControls = useMemo(
    () => ({
      currentIndex,
      setCurrentIndex,
      isPlaying,
      setIsPlaying,
      playIndex,
      togglePlay,
      next,
      prev,
      seekTo,
    }),
    [currentIndex, isPlaying, playIndex, togglePlay, next, prev, seekTo],
  )

  return {
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    progress,
    duration,
    volume,
    setVolume,
    muted,
    setMuted,
    shuffle,
    setShuffle,
    repeat,
    audioRef,
    currentTrack,
    playIndex,
    togglePlay,
    next,
    prev,
    seekTo,
    cycleRepeat,
    onTimeUpdate,
    onLoadedMetadata,
    onPlay,
    onPause,
    onSeek,
    playbackControls,
  }
}
