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

  // Reconcile React state with the audio element's actual state. The browser or
  // OS can pause playback on its own (e.g. when a locked device enters deep
  // sleep). Without this, `isPlaying` stays true while audio is silent, leaving
  // the UI (play button, equalizer, progress bar) out of sync with reality.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      // A natural track end also pauses the element, but that case is handled by
      // the `ended` event advancing to the next track, so ignore it here.
      if (a.ended) return
      setIsPlaying(false)
    }
    a.addEventListener('play', handlePlay)
    a.addEventListener('pause', handlePause)
    return () => {
      a.removeEventListener('play', handlePlay)
      a.removeEventListener('pause', handlePause)
    }
  }, [])

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
    onSeek,
    playbackControls,
  }
}
