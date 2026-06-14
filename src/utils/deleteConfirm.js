export function getTrackDeleteMode(view, selectedPlaylistId) {
  return view === 'playlists' && selectedPlaylistId ? 'playlist' : 'library'
}

export function getTrackDeleteConfirmCopy(mode) {
  if (mode === 'playlist') {
    return {
      title: 'Remove from playlist?',
      message: 'This song will be removed from the playlist but will stay in your library.',
      confirmLabel: 'Remove',
    }
  }

  return {
    title: 'Delete from library?',
    message:
      'This permanently removes the song from your device. You will need to add the file again to restore it.',
    confirmLabel: 'Delete',
  }
}

export function getPlaylistDeleteConfirmCopy() {
  return {
    title: 'Delete playlist?',
    message: 'This removes the playlist only. All songs will stay in your library on this device.',
    confirmLabel: 'Delete playlist',
  }
}

export function getClearLibraryConfirmCopy(step) {
  if (step === 'final') {
    return {
      title: 'Are you REALLY sure?',
      message:
        'This is your last chance. Every song, favorite, and playlist will be permanently erased from this device.',
      confirmLabel: 'Yes, delete everything',
    }
  }

  return {
    title: 'Delete entire library?',
    message:
      'This permanently removes all songs, favorites, and playlists from this device. You will need to add your music again.',
    confirmLabel: 'Continue',
  }
}
