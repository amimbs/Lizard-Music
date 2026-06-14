import {
  IconPlaylist,
  IconPlus,
  IconTrash,
} from '../icons.jsx'

export function PlaylistsBrowser({
  playlists,
  newPlaylistName,
  onNewPlaylistNameChange,
  onCreatePlaylist,
  onOpenPlaylist,
  onDeletePlaylist,
  hasSearch,
}) {
  const handleCreate = (e) => {
    e.preventDefault()
    onCreatePlaylist()
  }

  return (
    <div className="playlists-browser">
      <div className="page-title">
        <h1>Playlists</h1>
        <span className="page-count">
          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
        </span>
      </div>

      <form className="create-playlist" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New playlist name"
          value={newPlaylistName}
          onChange={(e) => onNewPlaylistNameChange(e.target.value)}
          aria-label="New playlist name"
        />
        <button type="submit" className="btn primary" disabled={!newPlaylistName.trim()}>
          <IconPlus /> Create
        </button>
      </form>

      {playlists.length === 0 ? (
        <div className="view-empty playlists-empty">
          <div className="view-empty-icon"><IconPlaylist /></div>
          <h2>{hasSearch ? 'No playlists match your search' : 'No playlists yet'}</h2>
          <p>
            {hasSearch
              ? 'Try a different search term.'
              : 'Create a playlist above, then add songs from your library.'}
          </p>
        </div>
      ) : (
        <ul className="playlist-cards">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <button
                type="button"
                className="playlist-card"
                onClick={() => onOpenPlaylist(playlist.id)}
              >
                <span className="playlist-card-icon"><IconPlaylist /></span>
                <span className="playlist-card-meta">
                  <span className="playlist-card-name">{playlist.name}</span>
                  <span className="playlist-card-count">
                    {playlist.trackIds.length}{' '}
                    {playlist.trackIds.length === 1 ? 'song' : 'songs'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="playlist-card-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePlaylist(playlist.id)
                }}
                aria-label={`Delete ${playlist.name}`}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
