import { describe, expect, it, vi } from 'vitest'
import { switchView, getSearchPlaceholder } from './view.js'

function makeSetters() {
  return {
    setView: vi.fn(),
    setSelectedPlaylistId: vi.fn(),
    setSelectedAlbumKey: vi.fn(),
    setSelectedArtist: vi.fn(),
    setSelectedArtistAlbum: vi.fn(),
    setSearch: vi.fn(),
  }
}

describe('switchView', () => {
  it('updates view, clears search, and clears all browse selections outside their tabs', () => {
    const setters = makeSetters()

    switchView({ ...setters, nextView: 'songs' })

    expect(setters.setView).toHaveBeenCalledWith('songs')
    expect(setters.setSelectedPlaylistId).toHaveBeenCalledWith(null)
    expect(setters.setSelectedAlbumKey).toHaveBeenCalledWith(null)
    expect(setters.setSelectedArtist).toHaveBeenCalledWith(null)
    expect(setters.setSelectedArtistAlbum).toHaveBeenCalledWith(null)
    expect(setters.setSearch).toHaveBeenCalledWith('')
  })

  it('keeps playlist selection when switching to playlists view', () => {
    const setters = makeSetters()

    switchView({ ...setters, nextView: 'playlists' })

    expect(setters.setSelectedPlaylistId).not.toHaveBeenCalled()
  })

  it('clears album selection when leaving albums view', () => {
    const setters = makeSetters()

    switchView({ ...setters, nextView: 'albums' })

    expect(setters.setSelectedAlbumKey).not.toHaveBeenCalled()
    expect(setters.setSelectedArtist).toHaveBeenCalledWith(null)
  })

  it('clears artist selection when leaving artists view', () => {
    const setters = makeSetters()

    switchView({ ...setters, nextView: 'artists' })

    expect(setters.setSelectedArtist).not.toHaveBeenCalled()
    expect(setters.setSelectedAlbumKey).toHaveBeenCalledWith(null)
  })
})

describe('getSearchPlaceholder', () => {
  const ctx = {
    selectedPlaylistId: null,
    selectedAlbumKey: null,
    selectedArtist: null,
    selectedArtistAlbum: null,
  }

  it('returns context-specific placeholders', () => {
    expect(getSearchPlaceholder('playlists', ctx)).toBe('Search playlists')
    expect(getSearchPlaceholder('playlists', { ...ctx, selectedPlaylistId: 'pl-1' })).toBe(
      'Search this playlist',
    )
    expect(getSearchPlaceholder('albums', ctx)).toBe('Search albums')
    expect(getSearchPlaceholder('albums', { ...ctx, selectedAlbumKey: 'key' })).toBe(
      'Search this album',
    )
    expect(getSearchPlaceholder('artists', ctx)).toBe('Search artists')
    expect(getSearchPlaceholder('artists', { ...ctx, selectedArtist: 'Artist' })).toBe(
      'Search albums',
    )
    expect(
      getSearchPlaceholder('artists', {
        ...ctx,
        selectedArtist: 'Artist',
        selectedArtistAlbum: 'Album',
      }),
    ).toBe('Search this album')
    expect(getSearchPlaceholder('songs', ctx)).toBe('Search your library')
  })
})
