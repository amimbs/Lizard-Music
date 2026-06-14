import { describe, expect, it, vi } from 'vitest'
import { switchView, getSearchPlaceholder } from './view.js'

describe('switchView', () => {
  it('updates view, clears search, and clears playlist selection outside playlists', () => {
    const setView = vi.fn()
    const setSelectedPlaylistId = vi.fn()
    const setSearch = vi.fn()

    switchView(setView, setSelectedPlaylistId, setSearch, 'songs')

    expect(setView).toHaveBeenCalledWith('songs')
    expect(setSelectedPlaylistId).toHaveBeenCalledWith(null)
    expect(setSearch).toHaveBeenCalledWith('')
  })

  it('keeps playlist selection when switching to playlists view', () => {
    const setView = vi.fn()
    const setSelectedPlaylistId = vi.fn()
    const setSearch = vi.fn()

    switchView(setView, setSelectedPlaylistId, setSearch, 'playlists')

    expect(setView).toHaveBeenCalledWith('playlists')
    expect(setSelectedPlaylistId).not.toHaveBeenCalled()
    expect(setSearch).toHaveBeenCalledWith('')
  })
})

describe('getSearchPlaceholder', () => {
  it('returns context-specific placeholders', () => {
    expect(getSearchPlaceholder('playlists', null)).toBe('Search playlists')
    expect(getSearchPlaceholder('playlists', 'pl-1')).toBe('Search this playlist')
    expect(getSearchPlaceholder('songs', null)).toBe('Search your library')
  })
})
