import { describe, expect, it } from 'vitest'
import {
  getTrackDeleteMode,
  getTrackDeleteConfirmCopy,
  getPlaylistDeleteConfirmCopy,
} from './deleteConfirm.js'

describe('getTrackDeleteMode', () => {
  it('uses playlist mode inside an open playlist', () => {
    expect(getTrackDeleteMode('playlists', 'p1')).toBe('playlist')
  })

  it('uses library mode everywhere else', () => {
    expect(getTrackDeleteMode('songs', null)).toBe('library')
    expect(getTrackDeleteMode('playlists', null)).toBe('library')
    expect(getTrackDeleteMode('favorites', null)).toBe('library')
  })
})

describe('getTrackDeleteConfirmCopy', () => {
  it('returns playlist-safe copy when removing from a playlist', () => {
    const copy = getTrackDeleteConfirmCopy('playlist')
    expect(copy.title).toBe('Remove from playlist?')
    expect(copy.message).toContain('stay in your library')
    expect(copy.confirmLabel).toBe('Remove')
  })

  it('returns destructive copy when deleting from the library', () => {
    const copy = getTrackDeleteConfirmCopy('library')
    expect(copy.title).toBe('Delete from library?')
    expect(copy.message).toContain('permanently removes')
    expect(copy.confirmLabel).toBe('Delete')
  })
})

describe('getPlaylistDeleteConfirmCopy', () => {
  it('states that songs remain on the device', () => {
    const copy = getPlaylistDeleteConfirmCopy()
    expect(copy.title).toBe('Delete playlist?')
    expect(copy.message).toContain('All songs will stay in your library')
    expect(copy.confirmLabel).toBe('Delete playlist')
  })
})
