import { useEffect } from 'react'

function mediaSessionTitle(track) {
  return track.favorite ? `♥ ${track.title}` : track.title
}

export function useMediaSession({
  currentTrack,
  isPlaying,
  progress,
  duration,
  setIsPlaying,
  next,
  prev,
  seekTo,
  onStop,
}) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: mediaSessionTitle(currentTrack),
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
    navigator.mediaSession.setActionHandler('stop', () => {
      onStop()
      navigator.mediaSession.playbackState = 'none'
      navigator.mediaSession.metadata = null
    })

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('seekto', null)
      navigator.mediaSession.setActionHandler('stop', null)
    }
  }, [currentTrack, next, prev, seekTo, setIsPlaying, onStop])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!currentTrack) {
      navigator.mediaSession.playbackState = 'none'
      return
    }
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [currentTrack, isPlaying])

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
}
