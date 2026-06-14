import { useState, useMemo } from 'react'
import { RECENT_MS } from '../constants.js'
import { sortByTitle } from '../utils/tracks.js'

export function useTrackViews({ tracks, playlists }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('songs')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  )

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

  const hasTracks = tracks.length > 0
  const recentEmpty = view === 'recent' && viewList.length === 0 && !search.trim()
  const favoritesEmpty = view === 'favorites' && viewList.length === 0 && !search.trim()
  const playlistDetailEmpty =
    view === 'playlists' && selectedPlaylistId && viewList.length === 0 && !search.trim()

  return {
    search,
    setSearch,
    view,
    setView,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedPlaylist,
    viewList,
    displayedPlaylists,
    displayed,
    playOrder,
    hasTracks,
    recentEmpty,
    favoritesEmpty,
    playlistDetailEmpty,
  }
}
