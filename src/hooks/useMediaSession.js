import { useEffect } from 'react'

export function useMediaSession({ currentTrack, isPlaying, progress, duration, setIsPlaying, next, prev, seekTo }) {
  const trackId = currentTrack?.id
  const trackTitle = currentTrack?.title
  const trackArtist = currentTrack?.artist
  const trackCover = currentTrack?.cover

  useEffect(() => {
    if (!('mediaSession' in navigator) || !trackId) return

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: trackTitle,
      artist: trackArtist,
      artwork: trackCover ? [{ src: trackCover }] : [],
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
  }, [trackId, trackTitle, trackArtist, trackCover, next, prev, seekTo, setIsPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = !trackId ? 'none' : isPlaying ? 'playing' : 'paused'
  }, [trackId, isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !trackId || !duration) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(progress, duration),
      })
    } catch {
      // setPositionState not supported in this browser.
    }
  }, [trackId, progress, duration])
}
