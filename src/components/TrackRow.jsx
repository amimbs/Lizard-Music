import { memo } from 'react'
import { IconPlay, IconMusic } from '../icons.jsx'
import { formatTime } from '../utils/format.js'
import { TrackMenu } from './TrackMenu.jsx'

export const TrackRow = memo(function TrackRow({
  track,
  displayIndex,
  isCurrent,
  isPlaying,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onRemove,
  removeLabel,
}) {
  const handleRowClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.menu-dropdown')) return
    onPlay()
  }

  return (
    <div
      className={`track ${isCurrent ? 'current' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay()
        }
      }}
    >
      <button className="col-num" onClick={onPlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
          <span className="eq"><i></i><i></i><i></i></span>
        ) : (
          <>
            <span className="num">{displayIndex + 1}</span>
            <span className="play-hover"><IconPlay /></span>
          </>
        )}
      </button>
      <div className="col-title">
        <div className="cover-sm">
          {track.cover ? <img src={track.cover} alt="" loading="lazy" /> : <IconMusic />}
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
          onRemove={onRemove}
        />
      </div>
    </div>
  )
})
