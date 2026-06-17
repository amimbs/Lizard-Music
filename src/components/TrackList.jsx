import { useVirtualizer } from '@tanstack/react-virtual'
import { IconBack } from '../icons.jsx'
import { VIEW_TITLES } from '../constants.js'
import { TrackRow } from './TrackRow.jsx'

export function TrackList({
  contentRef,
  displayed,
  search,
  view,
  selectedPlaylistId,
  selectedPlaylist,
  currentIndex,
  isPlaying,
  estimateRowSize,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onAddToPlaylist,
  onRemoveTrack,
  onBackToPlaylists,
}) {
  const virtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: () => contentRef.current,
    estimateSize: estimateRowSize,
    overscan: 8,
  })

  const pageTitle =
    view === 'playlists' && selectedPlaylist
      ? selectedPlaylist.name
      : VIEW_TITLES[view]

  const isPlaylistView = view === 'playlists' && selectedPlaylistId

  return (
    <div className="playlist">
      <div className="page-title">
        {isPlaylistView && (
          <button
            type="button"
            className="page-back"
            onClick={onBackToPlaylists}
            aria-label="Back to playlists"
          >
            <IconBack />
          </button>
        )}
        <h1>{pageTitle}</h1>
        <span className="page-count">
          {displayed.length} {displayed.length === 1 ? 'song' : 'songs'}
        </span>
      </div>
      <div className="playlist-head">
        <span className="col-title">Title</span>
        <span className="col-dur">Time</span>
        <span className="col-actions" aria-hidden="true" />
      </div>
      <div
        className="playlist-body playlist-virtual"
        style={{ height: displayed.length ? `${virtualizer.getTotalSize()}px` : undefined }}
      >
        {displayed.length === 0 ? (
          <div className="no-results">No tracks match “{search}”.</div>
        ) : (
          virtualizer.getVirtualItems().map((virtualRow) => {
            const { track, index } = displayed[virtualRow.index]
            const isCurrent = index === currentIndex

            return (
              <div
                key={track.id}
                className="playlist-virtual-row"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TrackRow
                  track={track}
                  isCurrent={isCurrent}
                  isPlaying={isPlaying && isCurrent}
                  isFavorite={track.favorite}
                  onPlay={() => (isCurrent ? onTogglePlay() : onPlayTrack(index))}
                  onToggleFavorite={() => onToggleFavorite(track.id)}
                  onAddToPlaylist={() => onAddToPlaylist(track.id)}
                  onRemove={() => onRemoveTrack(track.id)}
                  removeLabel={
                    isPlaylistView ? 'Remove from playlist' : 'Remove from library'
                  }
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
