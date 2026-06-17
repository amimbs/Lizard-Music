import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import './App.css'
import { useInstallPrompt } from './useInstallPrompt.js'
import { usePwaUpdate } from './usePwaUpdate.js'
import { useObjectUrls } from './hooks/useObjectUrls.js'
import { useMusicLibrary } from './hooks/useMusicLibrary.js'
import { useTrackViews } from './hooks/useTrackViews.js'
import { usePlayback } from './hooks/usePlayback.js'
import { useRowHeight } from './hooks/useRowHeight.js'
import { useMediaSession } from './hooks/useMediaSession.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useTheme } from './hooks/useTheme.js'
import { TopBar } from './components/TopBar.jsx'
import { LibraryContent } from './components/LibraryContent.jsx'
import { PlayerFooter } from './components/PlayerFooter.jsx'
import { AppBanner } from './components/AppBanner.jsx'
import { UpdateOverlay } from './components/UpdateOverlay.jsx'
import { getActiveBanner } from './utils/banners.js'
import { AddToPlaylistModal } from './components/AddToPlaylistModal.jsx'
import { ConfirmModal } from './components/ConfirmModal.jsx'
import {
  getTrackDeleteMode,
  getTrackDeleteConfirmCopy,
  getPlaylistDeleteConfirmCopy,
  getClearLibraryConfirmCopy,
} from './utils/deleteConfirm.js'
import { switchView } from './utils/view.js'
import { firstSongIndex } from './utils/tracks.js'

export default function App() {
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const initialQueueDoneRef = useRef(false)

  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletePlaylistConfirmId, setDeletePlaylistConfirmId] = useState(null)
  const [clearLibraryStep, setClearLibraryStep] = useState(null)

  const { theme, setTheme } = useTheme()

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
    clearLibrary,
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
    stop,
    cycleRepeat,
    onTimeUpdate,
    onLoadedMetadata,
    onSeek,
    playbackControls,
  } = usePlayback({ tracks, playOrder })

  const { estimateRowSize } = useRowHeight()
  const { showBanner, showManualHint, install, dismiss } = useInstallPrompt()
  const { showBanner: showUpdateBanner, applyUpdate, dismiss: dismissUpdate, isUpdating } = usePwaUpdate()

  const activeBanner = getActiveBanner({
    storageError,
    onDismissStorage: () => setStorageError(''),
    showUpdateBanner: showUpdateBanner && !isUpdating,
    onUpdate: applyUpdate,
    onDismissUpdate: dismissUpdate,
    showInstallBanner: showBanner,
    showManualHint,
    onInstall: install,
    onDismissInstall: dismiss,
  })

  const addToPlaylistTrack = useMemo(
    () => (addToPlaylistTrackId ? tracks.find((t) => t.id === addToPlaylistTrackId) ?? null : null),
    [addToPlaylistTrackId, tracks],
  )

  const handleAddFiles = useCallback(
    async (fileList) => {
      await addFiles(fileList)
    },
    [addFiles],
  )

  useEffect(() => {
    if (tracks.length === 0) {
      initialQueueDoneRef.current = false
      return
    }
    if (!libraryReady || initialQueueDoneRef.current || currentIndex >= 0) return

    const index = firstSongIndex(tracks)
    if (index >= 0) {
      setCurrentIndex(index)
      initialQueueDoneRef.current = true
    }
  }, [libraryReady, tracks, currentIndex, setCurrentIndex])

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

  const hasLibraryContent = tracks.length > 0 || playlists.length > 0

  const handleRequestClearLibrary = useCallback(() => {
    if (!hasLibraryContent) return
    setClearLibraryStep('first')
  }, [hasLibraryContent])

  const confirmClearLibrary = useCallback(async () => {
    await clearLibrary()
    setClearLibraryStep(null)
    setCurrentIndex(-1)
    setIsPlaying(false)
    switchView(setView, setSelectedPlaylistId, setSearch, 'songs')
    setDeleteConfirm(null)
    setDeletePlaylistConfirmId(null)
    setAddToPlaylistTrackId(null)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [
    clearLibrary,
    setCurrentIndex,
    setIsPlaying,
    setView,
    setSelectedPlaylistId,
    setSearch,
    audioRef,
  ])

  useMediaSession({
    currentTrack,
    isPlaying,
    progress,
    duration,
    setIsPlaying,
    next,
    prev,
    seekTo,
    onStop: stop,
  })

  useKeyboardShortcuts({ togglePlay, next, prev })

  const pickFiles = useCallback(() => fileInputRef.current?.click(), [])
  const pickFolder = useCallback(() => folderInputRef.current?.click(), [])

  const trackDeleteCopy = deleteConfirm ? getTrackDeleteConfirmCopy(deleteConfirm.mode) : null
  const playlistDeleteCopy = deletePlaylistConfirm ? getPlaylistDeleteConfirmCopy() : null
  const clearLibraryCopy = clearLibraryStep ? getClearLibraryConfirmCopy(clearLibraryStep) : null

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
        onDeleteLibrary={handleRequestClearLibrary}
        hasLibraryContent={hasLibraryContent}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className="app-banners">
        {activeBanner && <AppBanner {...activeBanner} />}
      </div>

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

      {clearLibraryStep && clearLibraryCopy && (
        <ConfirmModal
          title={clearLibraryCopy.title}
          message={clearLibraryCopy.message}
          confirmLabel={clearLibraryCopy.confirmLabel}
          cancelLabel="Cancel"
          confirmDanger
          onConfirm={
            clearLibraryStep === 'first'
              ? () => setClearLibraryStep('final')
              : confirmClearLibrary
          }
          onCancel={() => setClearLibraryStep(null)}
        />
      )}

      {isUpdating && <UpdateOverlay />}
    </div>
  )
}
