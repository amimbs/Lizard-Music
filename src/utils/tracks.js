const ALBUM_KEY_SEP = '\x1e'

export function albumKey(artist, album) {
  return `${artist}${ALBUM_KEY_SEP}${album}`
}

export function parseAlbumKey(key) {
  const sep = key.indexOf(ALBUM_KEY_SEP)
  if (sep === -1) return { artist: key, album: '' }
  return {
    artist: key.slice(0, sep),
    album: key.slice(sep + 1),
  }
}

function compareLocale(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function groupCover(items) {
  return items.find(({ track }) => track.cover)?.track.cover ?? null
}

export function sortByTitle(a, b) {
  const titleCmp = a.track.title.toLowerCase().localeCompare(b.track.title.toLowerCase())
  if (titleCmp !== 0) return titleCmp
  return a.track.artist.toLowerCase().localeCompare(b.track.artist.toLowerCase())
}

export function groupTracksByAlbum(tracks) {
  const groups = new Map()
  tracks.forEach((track, index) => {
    const key = albumKey(track.artist, track.album)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        artist: track.artist,
        album: track.album,
        items: [],
      })
    }
    groups.get(key).items.push({ track, index })
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      cover: groupCover(group.items),
      trackCount: group.items.length,
    }))
    .sort((a, b) => {
      const albumCmp = compareLocale(a.album, b.album)
      if (albumCmp !== 0) return albumCmp
      return compareLocale(a.artist, b.artist)
    })
}

export function groupTracksByArtist(tracks) {
  const groups = new Map()
  tracks.forEach((track, index) => {
    if (!groups.has(track.artist)) {
      groups.set(track.artist, { artist: track.artist, items: [], albums: new Set() })
    }
    const group = groups.get(track.artist)
    group.items.push({ track, index })
    group.albums.add(track.album)
  })

  return [...groups.values()]
    .map((group) => ({
      artist: group.artist,
      items: group.items,
      albumCount: group.albums.size,
      trackCount: group.items.length,
      cover: groupCover(group.items),
    }))
    .sort((a, b) => compareLocale(a.artist, b.artist))
}

export function albumsForArtist(tracks, artist) {
  const filtered = tracks.filter((track) => track.artist === artist)
  return groupTracksByAlbum(filtered)
}

export function firstSongIndex(tracks) {
  if (tracks.length === 0) return -1
  return tracks
    .map((track, index) => ({ track, index }))
    .sort(sortByTitle)[0].index
}

export function buildShuffleOrder(order, exclude) {
  const shuffled = order.filter((i) => i !== exclude)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return exclude >= 0 ? [exclude, ...shuffled] : shuffled
}
