import { useRef } from 'react'
import { PlaylistsBrowser } from './PlaylistsBrowser.jsx'
import { EmptyState } from './EmptyState.jsx'
import { TrackList } from './TrackList.jsx'
import {
  RestoringLibrary,
  RecentEmpty,
  FavoritesEmpty,
  PlaylistDetailEmpty,
} from './ViewEmpty.jsx'

export function LibraryContent({
  libraryReady,
  view,
  selectedPlaylistId,
  selectedPlaylist,
  displayedPlaylists,
  displayed,
  search,
  hasTracks,
  recentEmpty,
  favoritesEmpty,
  playlistDetailEmpty,
  newPlaylistName,
  onNewPlaylistNameChange,
  onCreatePlaylist,
  onOpenPlaylist,
  onDeletePlaylist,
  onPickFiles,
  onPickFolder,
  onBackToPlaylists,
  currentIndex,
  isPlaying,
  estimateRowSize,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onAddToPlaylist,
  onRemoveTrack,
}) {
  const contentRef = useRef(null)

  if (!libraryReady) {
    return (
      <main className="content" ref={contentRef}>
        <RestoringLibrary />
      </main>
    )
  }

  const renderContent = () => {
    if (view === 'playlists' && !selectedPlaylistId) {
      return (
        <PlaylistsBrowser
          playlists={displayedPlaylists}
          newPlaylistName={newPlaylistName}
          onNewPlaylistNameChange={onNewPlaylistNameChange}
          onCreatePlaylist={onCreatePlaylist}
          onOpenPlaylist={onOpenPlaylist}
          onDeletePlaylist={onDeletePlaylist}
          hasSearch={!!search.trim()}
        />
      )
    }

    if (!hasTracks) {
      return <EmptyState onPickFiles={onPickFiles} onPickFolder={onPickFolder} />
    }

    if (recentEmpty) return <RecentEmpty />
    if (favoritesEmpty) return <FavoritesEmpty />
    if (playlistDetailEmpty) {
      return <PlaylistDetailEmpty onBack={onBackToPlaylists} />
    }

    return (
      <TrackList
        contentRef={contentRef}
        displayed={displayed}
        search={search}
        view={view}
        selectedPlaylistId={selectedPlaylistId}
        selectedPlaylist={selectedPlaylist}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        estimateRowSize={estimateRowSize}
        onPlayTrack={onPlayTrack}
        onTogglePlay={onTogglePlay}
        onToggleFavorite={onToggleFavorite}
        onAddToPlaylist={onAddToPlaylist}
        onRemoveTrack={onRemoveTrack}
        onBackToPlaylists={onBackToPlaylists}
      />
    )
  }

  return (
    <main className="content" ref={contentRef}>
      {renderContent()}
    </main>
  )
}
