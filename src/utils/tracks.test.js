import { describe, expect, it, vi } from 'vitest'
import {
  sortByTitle,
  buildShuffleOrder,
  firstSongIndex,
  albumKey,
  parseAlbumKey,
  groupTracksByAlbum,
  groupTracksByArtist,
  albumsForArtist,
} from './tracks.js'

function entry(title, artist, index = 0, album = 'Unknown album') {
  return { track: { title, artist, album }, index }
}

function makeTrack(title, artist, album = 'Unknown album', cover = null) {
  return { title, artist, album, cover }
}

describe('sortByTitle', () => {
  it('sorts by title, then artist', () => {
    const items = [
      entry('Zebra', 'Band B', 2),
      entry('Alpha', 'Band B', 0),
      entry('Alpha', 'Band A', 1),
    ]

    const sorted = [...items].sort(sortByTitle)
    expect(sorted.map((i) => i.index)).toEqual([1, 0, 2])
  })
})

describe('firstSongIndex', () => {
  it('returns the tracks-array index of the alphabetically first song', () => {
    const tracks = [
      { title: 'Zulu', artist: 'A' },
      { title: 'Alpha', artist: 'B' },
      { title: 'Alpha', artist: 'A' },
    ]

    expect(firstSongIndex(tracks)).toBe(2)
  })

  it('returns -1 for an empty library', () => {
    expect(firstSongIndex([])).toBe(-1)
  })
})

describe('buildShuffleOrder', () => {
  it('places excluded index first when provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const order = buildShuffleOrder([0, 1, 2, 3], 2)
    expect(order[0]).toBe(2)
    expect(order).toHaveLength(4)
    expect(new Set(order)).toEqual(new Set([0, 1, 2, 3]))
  })

  it('returns a shuffled copy when exclude is negative', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const order = buildShuffleOrder([0, 1, 2], -1)
    expect(order).toHaveLength(3)
    expect(new Set(order)).toEqual(new Set([0, 1, 2]))
  })
})

describe('albumKey', () => {
  it('round-trips artist and album', () => {
    const key = albumKey('The Beatles', 'Abbey Road')
    expect(parseAlbumKey(key)).toEqual({ artist: 'The Beatles', album: 'Abbey Road' })
  })
})

describe('groupTracksByAlbum', () => {
  it('groups by artist and album composite key', () => {
    const tracks = [
      makeTrack('One', 'Artist A', 'Album X'),
      makeTrack('Two', 'Artist A', 'Album X'),
      makeTrack('Three', 'Artist B', 'Album X'),
    ]

    const groups = groupTracksByAlbum(tracks)
    expect(groups).toHaveLength(2)
    expect(groups[0].album).toBe('Album X')
    expect(groups[0].artist).toBe('Artist A')
    expect(groups[0].trackCount).toBe(2)
    expect(groups[1].artist).toBe('Artist B')
    expect(groups[1].trackCount).toBe(1)
  })

  it('sorts groups by album then artist', () => {
    const tracks = [
      makeTrack('Z', 'B', 'Zulu'),
      makeTrack('A', 'A', 'Alpha'),
    ]

    const groups = groupTracksByAlbum(tracks)
    expect(groups.map((g) => g.album)).toEqual(['Alpha', 'Zulu'])
  })

  it('uses first track cover in group', () => {
    const tracks = [
      makeTrack('One', 'A', 'Album', null),
      makeTrack('Two', 'A', 'Album', 'blob:cover'),
    ]

    expect(groupTracksByAlbum(tracks)[0].cover).toBe('blob:cover')
  })
})

describe('groupTracksByArtist', () => {
  it('groups tracks and counts albums', () => {
    const tracks = [
      makeTrack('One', 'Artist A', 'Album 1'),
      makeTrack('Two', 'Artist A', 'Album 2'),
      makeTrack('Three', 'Artist B', 'Album 1'),
    ]

    const groups = groupTracksByArtist(tracks)
    expect(groups).toHaveLength(2)
    expect(groups[0].artist).toBe('Artist A')
    expect(groups[0].albumCount).toBe(2)
    expect(groups[0].trackCount).toBe(2)
  })
})

describe('albumsForArtist', () => {
  it('returns album groups for one artist only', () => {
    const tracks = [
      makeTrack('One', 'Artist A', 'Album 1'),
      makeTrack('Two', 'Artist B', 'Album 2'),
      makeTrack('Three', 'Artist A', 'Album 2'),
    ]

    const albums = albumsForArtist(tracks, 'Artist A')
    expect(albums).toHaveLength(2)
    expect(albums.every((a) => a.artist === 'Artist A')).toBe(true)
  })
})
