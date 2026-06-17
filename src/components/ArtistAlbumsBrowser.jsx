import { IconAlbum } from '../icons.jsx'
import { BrowseGrid } from './BrowseGrid.jsx'

export function ArtistAlbumsBrowser({ artist, groups, hasSearch, onBack, onOpenAlbum }) {
  const items = groups.map((group) => ({
    id: group.key,
    title: group.album,
    count: `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'}`,
    cover: group.cover,
    icon: <IconAlbum />,
    onOpen: () => onOpenAlbum(group.album),
  }))

  return (
    <BrowseGrid
      title={artist}
      countLabel={`${groups.length} ${groups.length === 1 ? 'album' : 'albums'}`}
      items={items}
      hasSearch={hasSearch}
      emptyTitle="No albums for this artist"
      emptyMessage="This artist has no album-tagged songs."
      emptyIcon={<IconAlbum />}
      showBack
      onBack={onBack}
      backLabel="Back to artists"
    />
  )
}
