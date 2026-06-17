import { useState, useMemo } from 'react'
import { RECENT_MS } from '../constants.js'
import {
  sortByTitle,
  groupTracksByAlbum,
  groupTracksByArtist,
  albumsForArtist,
  parseAlbumKey,
} from '../utils/tracks.js'

export function useTrackViews({ tracks, playlists }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('songs')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null)
  const [selectedAlbumKey, setSelectedAlbumKey] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [selectedArtistAlbum, setSelectedArtistAlbum] = useState(null)

  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  )

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumKey) return null
    return parseAlbumKey(selectedAlbumKey)
  }, [selectedAlbumKey])

  const albumGroups = useMemo(() => groupTracksByAlbum(tracks), [tracks])
  const artistGroups = useMemo(() => groupTracksByArtist(tracks), [tracks])
  const artistAlbumGroups = useMemo(
    () => (selectedArtist ? albumsForArtist(tracks, selectedArtist) : []),
    [tracks, selectedArtist],
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
    if (view === 'albums' && selectedAlbumKey) {
      const { artist, album } = parseAlbumKey(selectedAlbumKey)
      return indexed
        .filter(({ track }) => track.artist === artist && track.album === album)
        .sort(sortByTitle)
    }
    if (view === 'artists' && selectedArtist && selectedArtistAlbum) {
      return indexed
        .filter(
          ({ track }) =>
            track.artist === selectedArtist && track.album === selectedArtistAlbum,
        )
        .sort(sortByTitle)
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
  }, [
    tracks,
    view,
    selectedPlaylistId,
    selectedAlbumKey,
    selectedArtist,
    selectedArtistAlbum,
    playlists,
  ])

  const displayedPlaylists = useMemo(() => {
    if (!search.trim()) return playlists
    const q = search.toLowerCase()
    return playlists.filter((p) => p.name.toLowerCase().includes(q))
  }, [playlists, search])

  const displayedAlbumGroups = useMemo(() => {
    if (!search.trim()) return albumGroups
    const q = search.toLowerCase()
    return albumGroups.filter(
      (group) =>
        group.album.toLowerCase().includes(q) ||
        group.artist.toLowerCase().includes(q),
    )
  }, [albumGroups, search])

  const displayedArtistGroups = useMemo(() => {
    if (!search.trim()) return artistGroups
    const q = search.toLowerCase()
    return artistGroups.filter((group) => group.artist.toLowerCase().includes(q))
  }, [artistGroups, search])

  const displayedArtistAlbums = useMemo(() => {
    if (!search.trim()) return artistAlbumGroups
    const q = search.toLowerCase()
    return artistAlbumGroups.filter((group) => group.album.toLowerCase().includes(q))
  }, [artistAlbumGroups, search])

  const displayed = useMemo(() => {
    if (view === 'playlists' && !selectedPlaylistId) return []
    if (view === 'albums' && !selectedAlbumKey) return []
    if (view === 'artists' && (!selectedArtist || !selectedArtistAlbum)) return []
    if (!search.trim()) return viewList
    const q = search.toLowerCase()
    return viewList.filter(
      ({ track }) =>
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q),
    )
  }, [viewList, search, view, selectedPlaylistId, selectedAlbumKey, selectedArtist, selectedArtistAlbum])

  const playOrder = useMemo(() => displayed.map((d) => d.index), [displayed])

  const hasTracks = tracks.length > 0
  const recentEmpty = view === 'recent' && viewList.length === 0 && !search.trim()
  const favoritesEmpty = view === 'favorites' && viewList.length === 0 && !search.trim()
  const playlistDetailEmpty =
    view === 'playlists' && selectedPlaylistId && viewList.length === 0 && !search.trim()

  const trackListPageTitle = useMemo(() => {
    if (view === 'playlists' && selectedPlaylist) return selectedPlaylist.name
    if (view === 'albums' && selectedAlbum) return selectedAlbum.album
    if (view === 'artists' && selectedArtist && selectedArtistAlbum) return selectedArtistAlbum
    return null
  }, [view, selectedPlaylist, selectedAlbum, selectedArtist, selectedArtistAlbum])

  return {
    search,
    setSearch,
    view,
    setView,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedAlbumKey,
    setSelectedAlbumKey,
    selectedArtist,
    setSelectedArtist,
    selectedArtistAlbum,
    setSelectedArtistAlbum,
    selectedPlaylist,
    selectedAlbum,
    viewList,
    displayedPlaylists,
    displayedAlbumGroups,
    displayedArtistGroups,
    displayedArtistAlbums,
    displayed,
    playOrder,
    trackListPageTitle,
    hasTracks,
    recentEmpty,
    favoritesEmpty,
    playlistDetailEmpty,
  }
}
