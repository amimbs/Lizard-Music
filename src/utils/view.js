export function switchView({
  setView,
  setSelectedPlaylistId,
  setSelectedAlbumKey,
  setSelectedArtist,
  setSelectedArtistAlbum,
  setSearch,
  nextView,
}) {
  setView(nextView)
  if (nextView !== 'playlists') setSelectedPlaylistId(null)
  if (nextView !== 'albums') setSelectedAlbumKey(null)
  if (nextView !== 'artists') {
    setSelectedArtist(null)
    setSelectedArtistAlbum(null)
  }
  setSearch('')
}

export function getSearchPlaceholder(view, browseContext) {
  const {
    selectedPlaylistId,
    selectedAlbumKey,
    selectedArtist,
    selectedArtistAlbum,
  } = browseContext

  if (view === 'playlists' && !selectedPlaylistId) return 'Search playlists'
  if (view === 'playlists') return 'Search this playlist'
  if (view === 'albums' && !selectedAlbumKey) return 'Search albums'
  if (view === 'albums') return 'Search this album'
  if (view === 'artists' && !selectedArtist) return 'Search artists'
  if (view === 'artists' && !selectedArtistAlbum) return 'Search albums'
  if (view === 'artists') return 'Search this album'
  return 'Search your library'
}
