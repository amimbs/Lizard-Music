import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTrackViews } from './useTrackViews.js'
import { RECENT_MS } from '../constants.js'

function makeTrack(overrides = {}) {
  return {
    id: overrides.id ?? 't1',
    title: overrides.title ?? 'Alpha',
    artist: overrides.artist ?? 'Artist A',
    favorite: overrides.favorite ?? false,
    addedAt: overrides.addedAt ?? Date.now(),
  }
}

describe('useTrackViews', () => {
  it('sorts songs alphabetically by title', () => {
    const tracks = [
      makeTrack({ id: 't1', title: 'Zulu' }),
      makeTrack({ id: 't2', title: 'Alpha' }),
    ]

    const { result } = renderHook(() => useTrackViews({ tracks, playlists: [] }))

    expect(result.current.viewList.map(({ track }) => track.id)).toEqual(['t2', 't1'])
  })

  it('filters favorites and searches by title or artist', () => {
    const tracks = [
      makeTrack({ id: 't1', title: 'Loved Song', favorite: true }),
      makeTrack({ id: 't2', title: 'Other Song', artist: 'Beta Band' }),
    ]

    const { result } = renderHook(() => useTrackViews({ tracks, playlists: [] }))

    act(() => result.current.setView('favorites'))
    expect(result.current.displayed).toHaveLength(1)
    expect(result.current.displayed[0].track.id).toBe('t1')

    act(() => {
      result.current.setView('songs')
      result.current.setSearch('beta')
    })
    expect(result.current.displayed).toHaveLength(1)
    expect(result.current.displayed[0].track.id).toBe('t2')
  })

  it('shows only recent tracks in the recent view', () => {
    const now = Date.now()
    const tracks = [
      makeTrack({ id: 'old', addedAt: now - RECENT_MS - 1 }),
      makeTrack({ id: 'new', addedAt: now }),
    ]

    const { result } = renderHook(() => useTrackViews({ tracks, playlists: [] }))

    act(() => result.current.setView('recent'))
    expect(result.current.viewList.map(({ track }) => track.id)).toEqual(['new'])
    expect(result.current.recentEmpty).toBe(false)
  })

  it('builds playlist detail lists in track order', () => {
    const tracks = [
      makeTrack({ id: 't1', title: 'One' }),
      makeTrack({ id: 't2', title: 'Two' }),
      makeTrack({ id: 't3', title: 'Three' }),
    ]
    const playlists = [{ id: 'p1', name: 'Mix', trackIds: ['t3', 't1'] }]

    const { result } = renderHook(() => useTrackViews({ tracks, playlists }))

    act(() => {
      result.current.setView('playlists')
      result.current.setSelectedPlaylistId('p1')
    })

    expect(result.current.selectedPlaylist?.name).toBe('Mix')
    expect(result.current.displayed.map(({ track }) => track.id)).toEqual(['t3', 't1'])
    expect(result.current.playOrder).toEqual([2, 0])
  })
})
