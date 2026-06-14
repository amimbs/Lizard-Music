import { IconMusic, IconHeart, IconPlaylist, IconBack } from '../icons.jsx'

export function ViewEmpty({ icon: Icon, title, description, action }) {
  return (
    <div className="view-empty">
      <div className="view-empty-icon"><Icon /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function RestoringLibrary() {
  return (
    <div className="restoring">
      <div className="restoring-icon"><IconMusic /></div>
      <p>Restoring your library…</p>
    </div>
  )
}

export function RecentEmpty() {
  return (
    <ViewEmpty
      icon={IconMusic}
      title="Nothing added in the last 7 days"
      description="Songs you add will show up here for a week. Browse all music on the Songs page."
    />
  )
}

export function FavoritesEmpty() {
  return (
    <ViewEmpty
      icon={IconHeart}
      title="No favorites yet"
      description="Tap the heart on any song to save it here."
    />
  )
}

export function PlaylistDetailEmpty({ onBack }) {
  return (
    <ViewEmpty
      icon={IconPlaylist}
      title="This playlist is empty"
      description="Use the playlist button on any song to add it here."
      action={
        <button type="button" className="btn page-back-btn" onClick={onBack}>
          <IconBack /> Back to Playlists
        </button>
      }
    />
  )
}
