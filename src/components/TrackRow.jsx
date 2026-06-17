import { memo } from 'react'
import { IconMusic } from '../icons.jsx'
import { formatTime } from '../utils/format.js'
import { TrackMenu } from './TrackMenu.jsx'

export const TrackRow = memo(function TrackRow({
  track,
  isCurrent,
  isPlaying,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onEdit,
  onRemove,
  removeLabel,
}) {
  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.menu-dropdown')) return
    onPlay()
  }

  const rowLabel = isCurrent
    ? isPlaying
      ? `Playing ${track.title}`
      : `Paused ${track.title}`
    : `Play ${track.title}`

  return (
    <div
      className={`track ${isCurrent ? 'current' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-label={rowLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay()
        }
      }}
    >
      <div className="col-title">
        <div className="cover-sm">
          {isPlaying ? (
            <span className="eq" aria-hidden="true"><i></i><i></i><i></i></span>
          ) : track.cover ? (
            <img src={track.cover} alt="" loading="lazy" />
          ) : (
            <IconMusic />
          )}
        </div>
        <div className="title-meta">
          <div className="t-title" title={track.title}>{track.title}</div>
          <div className="t-artist" title={track.artist}>{track.artist}</div>
        </div>
      </div>
      <div className="col-dur">{track.duration ? formatTime(track.duration) : '—'}</div>
      <div className="col-actions track-actions">
        <TrackMenu
          isFavorite={isFavorite}
          removeLabel={removeLabel}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
})
