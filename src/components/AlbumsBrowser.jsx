import { IconAlbum } from '../icons.jsx'
import { BrowseGrid } from './BrowseGrid.jsx'

export function AlbumsBrowser({ groups, hasSearch, onOpenAlbum }) {
  const items = groups.map((group) => ({
    id: group.key,
    title: group.album,
    subtitle: group.artist,
    count: `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'}`,
    cover: group.cover,
    icon: <IconAlbum />,
    onOpen: () => onOpenAlbum(group.key),
  }))

  return (
    <BrowseGrid
      title="Albums"
      countLabel={`${groups.length} ${groups.length === 1 ? 'album' : 'albums'}`}
      items={items}
      hasSearch={hasSearch}
      emptyTitle="No albums yet"
      emptyMessage="Add music with album tags to see albums here."
      emptyIcon={<IconAlbum />}
    />
  )
}
