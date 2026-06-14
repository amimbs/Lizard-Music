import { useState } from 'react'

export function AddToPlaylistModal({ track, playlists, onSelect, onCreate, onClose }) {
  const [newName, setNewName] = useState('')

  const handleCreate = (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setNewName('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="add-to-playlist-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="add-to-playlist-title">Add to playlist</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {track && (
          <p className="modal-subtitle">
            {track.title} · {track.artist}
          </p>
        )}
        <form className="modal-create" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Create new playlist"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New playlist name"
          />
          <button type="submit" className="btn primary" disabled={!newName.trim()}>
            Create
          </button>
        </form>
        {playlists.length > 0 ? (
          <ul className="modal-playlist-list">
            {playlists.map((playlist) => {
              const alreadyAdded = track ? playlist.trackIds.includes(track.id) : false
              return (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className="modal-playlist-item"
                    disabled={alreadyAdded}
                    onClick={() => onSelect(playlist.id)}
                  >
                    <span className="modal-playlist-name">{playlist.name}</span>
                    <span className="modal-playlist-count">
                      {alreadyAdded
                        ? 'Already added'
                        : `${playlist.trackIds.length} ${playlist.trackIds.length === 1 ? 'song' : 'songs'}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="modal-empty">No playlists yet — create one above.</p>
        )}
      </div>
    </div>
  )
}
