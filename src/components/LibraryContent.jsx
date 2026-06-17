import { useRef } from 'react'
import { PlaylistsBrowser } from './PlaylistsBrowser.jsx'
import { AlbumsBrowser } from './AlbumsBrowser.jsx'
import { ArtistsBrowser } from './ArtistsBrowser.jsx'
import { ArtistAlbumsBrowser } from './ArtistAlbumsBrowser.jsx'
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
  selectedAlbumKey,
  selectedArtist,
  selectedArtistAlbum,
  selectedPlaylist,
  displayedPlaylists,
  displayedAlbumGroups,
  displayedArtistGroups,
  displayedArtistAlbums,
  displayed,
  search,
  trackListPageTitle,
  hasTracks,
  recentEmpty,
  favoritesEmpty,
  playlistDetailEmpty,
  newPlaylistName,
  onNewPlaylistNameChange,
  onCreatePlaylist,
  onOpenPlaylist,
  onDeletePlaylist,
  onOpenAlbum,
  onOpenArtist,
  onOpenArtistAlbum,
  onBackFromAlbum,
  onBackFromArtistAlbums,
  onBackFromArtistAlbum,
  onBackToPlaylists,
  onPickFiles,
  onPickFolder,
  currentIndex,
  isPlaying,
  estimateRowSize,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onAddToPlaylist,
  onEditTrack,
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

    if (view === 'albums' && !selectedAlbumKey) {
      if (!hasTracks) {
        return <EmptyState onPickFiles={onPickFiles} onPickFolder={onPickFolder} />
      }
      return (
        <AlbumsBrowser
          groups={displayedAlbumGroups}
          hasSearch={!!search.trim()}
          onOpenAlbum={onOpenAlbum}
        />
      )
    }

    if (view === 'artists' && !selectedArtist) {
      if (!hasTracks) {
        return <EmptyState onPickFiles={onPickFiles} onPickFolder={onPickFolder} />
      }
      return (
        <ArtistsBrowser
          groups={displayedArtistGroups}
          hasSearch={!!search.trim()}
          onOpenArtist={onOpenArtist}
        />
      )
    }

    if (view === 'artists' && selectedArtist && !selectedArtistAlbum) {
      return (
        <ArtistAlbumsBrowser
          artist={selectedArtist}
          groups={displayedArtistAlbums}
          hasSearch={!!search.trim()}
          onBack={onBackFromArtistAlbums}
          onOpenAlbum={onOpenArtistAlbum}
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

    const showBack =
      (view === 'playlists' && selectedPlaylistId) ||
      (view === 'albums' && selectedAlbumKey) ||
      (view === 'artists' && selectedArtist && selectedArtistAlbum)

    const onBack =
      view === 'playlists'
        ? onBackToPlaylists
        : view === 'albums'
          ? onBackFromAlbum
          : onBackFromArtistAlbum

    const backLabel =
      view === 'playlists'
        ? 'Back to playlists'
        : view === 'albums'
          ? 'Back to albums'
          : 'Back to albums'

    const removeLabel =
      view === 'playlists' && selectedPlaylistId
        ? 'Remove from playlist'
        : 'Remove from library'

    return (
      <TrackList
        contentRef={contentRef}
        displayed={displayed}
        search={search}
        view={view}
        pageTitle={trackListPageTitle}
        showBack={showBack}
        onBack={onBack}
        backLabel={backLabel}
        removeLabel={removeLabel}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        estimateRowSize={estimateRowSize}
        onPlayTrack={onPlayTrack}
        onTogglePlay={onTogglePlay}
        onToggleFavorite={onToggleFavorite}
        onAddToPlaylist={onAddToPlaylist}
        onEditTrack={onEditTrack}
        onRemoveTrack={onRemoveTrack}
      />
    )
  }

  return (
    <main className="content" ref={contentRef}>
      {renderContent()}
    </main>
  )
}
