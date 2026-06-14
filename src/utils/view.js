export function switchView(setView, setSelectedPlaylistId, setSearch, nextView) {
  setView(nextView)
  if (nextView !== 'playlists') setSelectedPlaylistId(null)
  setSearch('')
}

export function getSearchPlaceholder(view, selectedPlaylistId) {
  if (view === 'playlists' && !selectedPlaylistId) return 'Search playlists'
  if (view === 'playlists') return 'Search this playlist'
  return 'Search your library'
}
