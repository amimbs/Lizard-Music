import { useState, useRef, useCallback, useMemo } from 'react'
import './App.css'
import { useInstallPrompt } from './useInstallPrompt.js'
import { useObjectUrls } from './hooks/useObjectUrls.js'
import { useMusicLibrary } from './hooks/useMusicLibrary.js'
import { useTrackViews } from './hooks/useTrackViews.js'
import { usePlayback } from './hooks/usePlayback.js'
import { useRowHeight } from './hooks/useRowHeight.js'
import { useMediaSession } from './hooks/useMediaSession.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { TopBar } from './components/TopBar.jsx'
import { LibraryContent } from './components/LibraryContent.jsx'
import { PlayerFooter } from './components/PlayerFooter.jsx'
import { StorageBanner } from './components/StorageBanner.jsx'
import { InstallBanner } from './components/InstallBanner.jsx'
import { AddToPlaylistModal } from './components/AddToPlaylistModal.jsx'
import { ConfirmModal } from './components/ConfirmModal.jsx'
import {
  getTrackDeleteMode,
  getTrackDeleteConfirmCopy,
  getPlaylistDeleteConfirmCopy,
} from './utils/deleteConfirm.js'

export default function App() {
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletePlaylistConfirmId, setDeletePlaylistConfirmId] = useState(null)

  const { registerUrl, revokeUrl } = useObjectUrls()

  const {
    tracks,
    playlists,
    loading,
    libraryReady,
    storageError,
    setStorageError,
    addFiles,
    removeTrack,
    createPlaylist,
    removePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    toggleFavorite,
  } = useMusicLibrary({ registerUrl, revokeUrl })

  const {
    search,
    setSearch,
    view,
    setView,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedPlaylist,
    displayedPlaylists,
    displayed,
    playOrder,
    hasTracks,
    recentEmpty,
    favoritesEmpty,
    playlistDetailEmpty,
  } = useTrackViews({ tracks, playlists })

  const {
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    progress,
    duration,
    volume,
    setVolume,
    muted,
    setMuted,
    shuffle,
    setShuffle,
    repeat,
    audioRef,
    currentTrack,
    playIndex,
    togglePlay,
    next,
    prev,
    seekTo,
    cycleRepeat,
    onTimeUpdate,
    onLoadedMetadata,
    onSeek,
    playbackControls,
  } = usePlayback({ tracks, playOrder })

  const { estimateRowSize } = useRowHeight()
  const { showBanner, showManualHint, install, dismiss } = useInstallPrompt()

  const addToPlaylistTrack = useMemo(
    () => (addToPlaylistTrackId ? tracks.find((t) => t.id === addToPlaylistTrackId) ?? null : null),
    [addToPlaylistTrackId, tracks],
  )

  const handleAddFiles = useCallback(
    async (fileList) => {
      const wasEmpty = tracks.length === 0
      if (wasEmpty) setCurrentIndex(0)
      await addFiles(fileList)
    },
    [tracks.length, addFiles, setCurrentIndex],
  )

  const handleRemoveTrack = useCallback(
    (id) => {
      setDeleteConfirm({ trackId: id, mode: getTrackDeleteMode(view, selectedPlaylistId) })
    },
    [view, selectedPlaylistId],
  )

  const deleteConfirmTrack = useMemo(
    () =>
      deleteConfirm ? tracks.find((t) => t.id === deleteConfirm.trackId) ?? null : null,
    [deleteConfirm, tracks],
  )

  const confirmRemoveTrack = useCallback(() => {
    if (!deleteConfirm) return
    const { trackId, mode } = deleteConfirm
    if (mode === 'playlist') {
      removeTrackFromPlaylist(selectedPlaylistId, trackId)
    } else {
      removeTrack(trackId, playbackControls)
    }
    setDeleteConfirm(null)
  }, [deleteConfirm, selectedPlaylistId, removeTrackFromPlaylist, removeTrack, playbackControls])

  const handleCreatePlaylist = useCallback(async () => {
    const created = await createPlaylist(newPlaylistName)
    if (created) setNewPlaylistName('')
  }, [createPlaylist, newPlaylistName])

  const handleDeletePlaylist = useCallback((id) => {
    setDeletePlaylistConfirmId(id)
  }, [])

  const deletePlaylistConfirm = useMemo(
    () =>
      deletePlaylistConfirmId
        ? playlists.find((p) => p.id === deletePlaylistConfirmId) ?? null
        : null,
    [deletePlaylistConfirmId, playlists],
  )

  const confirmDeletePlaylist = useCallback(() => {
    if (!deletePlaylistConfirmId) return
    removePlaylist(deletePlaylistConfirmId, setSelectedPlaylistId, selectedPlaylistId)
    setDeletePlaylistConfirmId(null)
  }, [deletePlaylistConfirmId, removePlaylist, selectedPlaylistId])

  useMediaSession({
    currentTrack,
    progress,
    duration,
    setIsPlaying,
    next,
    prev,
    seekTo,
  })

  useKeyboardShortcuts({ togglePlay, next, prev })

  const pickFiles = useCallback(() => fileInputRef.current?.click(), [])
  const pickFolder = useCallback(() => folderInputRef.current?.click(), [])

  const trackDeleteCopy = deleteConfirm ? getTrackDeleteConfirmCopy(deleteConfirm.mode) : null
  const playlistDeleteCopy = deletePlaylistConfirm ? getPlaylistDeleteConfirmCopy() : null

  return (
    <div className="app">
      <TopBar
        view={view}
        setView={setView}
        setSelectedPlaylistId={setSelectedPlaylistId}
        search={search}
        setSearch={setSearch}
        selectedPlaylistId={selectedPlaylistId}
        fileInputRef={fileInputRef}
        folderInputRef={folderInputRef}
        onAddFiles={handleAddFiles}
      />

      <StorageBanner message={storageError} onDismiss={() => setStorageError('')} />

      <InstallBanner
        showBanner={showBanner}
        showManualHint={showManualHint}
        onInstall={install}
        onDismiss={dismiss}
      />

      <LibraryContent
        libraryReady={libraryReady}
        view={view}
        selectedPlaylistId={selectedPlaylistId}
        selectedPlaylist={selectedPlaylist}
        displayedPlaylists={displayedPlaylists}
        displayed={displayed}
        search={search}
        hasTracks={hasTracks}
        recentEmpty={recentEmpty}
        favoritesEmpty={favoritesEmpty}
        playlistDetailEmpty={playlistDetailEmpty}
        newPlaylistName={newPlaylistName}
        onNewPlaylistNameChange={setNewPlaylistName}
        onCreatePlaylist={handleCreatePlaylist}
        onOpenPlaylist={setSelectedPlaylistId}
        onDeletePlaylist={handleDeletePlaylist}
        onPickFiles={pickFiles}
        onPickFolder={pickFolder}
        onBackToPlaylists={() => setSelectedPlaylistId(null)}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        estimateRowSize={estimateRowSize}
        onPlayTrack={playIndex}
        onTogglePlay={togglePlay}
        onToggleFavorite={toggleFavorite}
        onAddToPlaylist={setAddToPlaylistTrackId}
        onRemoveTrack={handleRemoveTrack}
      />

      <PlayerFooter
        currentTrack={currentTrack}
        loading={loading}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        muted={muted}
        shuffle={shuffle}
        repeat={repeat}
        onTogglePlay={togglePlay}
        onPrev={prev}
        onNext={next}
        onSeek={onSeek}
        onToggleMute={() => setMuted((m) => !m)}
        onVolumeChange={(value) => {
          setVolume(value)
          setMuted(false)
        }}
        onToggleShuffle={() => setShuffle((s) => !s)}
        onCycleRepeat={cycleRepeat}
        onToggleFavorite={toggleFavorite}
      />

      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => next(true)}
      />

      {addToPlaylistTrackId && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          playlists={playlists}
          onSelect={async (playlistId) => {
            if (addToPlaylistTrackId) await addTrackToPlaylist(playlistId, addToPlaylistTrackId)
            setAddToPlaylistTrackId(null)
          }}
          onCreate={async (name) => {
            const created = await createPlaylist(name)
            if (created && addToPlaylistTrackId) {
              await addTrackToPlaylist(created.id, addToPlaylistTrackId)
            }
            setAddToPlaylistTrackId(null)
          }}
          onClose={() => setAddToPlaylistTrackId(null)}
        />
      )}

      {deleteConfirm && deleteConfirmTrack && trackDeleteCopy && (
        <ConfirmModal
          title={trackDeleteCopy.title}
          subtitle={`${deleteConfirmTrack.title} · ${deleteConfirmTrack.artist}`}
          message={trackDeleteCopy.message}
          confirmLabel={trackDeleteCopy.confirmLabel}
          cancelLabel="Cancel"
          confirmDanger
          onConfirm={confirmRemoveTrack}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {deletePlaylistConfirm && playlistDeleteCopy && (
        <ConfirmModal
          title={playlistDeleteCopy.title}
          subtitle={deletePlaylistConfirm.name}
          message={playlistDeleteCopy.message}
          confirmLabel={playlistDeleteCopy.confirmLabel}
          cancelLabel="Cancel"
          confirmDanger
          onConfirm={confirmDeletePlaylist}
          onCancel={() => setDeletePlaylistConfirmId(null)}
        />
      )}
    </div>
  )
}
