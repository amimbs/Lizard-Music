import { useEffect, useRef, useState } from 'react'

export function EditTrackModal({ track, onSave, onClose }) {
  const [title, setTitle] = useState(track.title)
  const [artist, setArtist] = useState(track.artist)
  const [album, setAlbum] = useState(track.album)
  const dialogRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    titleRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    onSave({ title: trimmedTitle, artist, album })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-labelledby="edit-track-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="edit-track-title">Edit song</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span className="modal-field-label">Title</span>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Title"
            />
          </label>
          <label className="modal-field">
            <span className="modal-field-label">Artist</span>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              aria-label="Artist"
            />
          </label>
          <label className="modal-field">
            <span className="modal-field-label">Album</span>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              aria-label="Album"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={!title.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
