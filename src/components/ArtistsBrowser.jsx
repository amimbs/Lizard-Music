import { IconArtist } from '../icons.jsx'
import { BrowseGrid } from './BrowseGrid.jsx'

export function ArtistsBrowser({ groups, hasSearch, onOpenArtist }) {
  const items = groups.map((group) => ({
    id: group.artist,
    title: group.artist,
    count: `${group.albumCount} ${group.albumCount === 1 ? 'album' : 'albums'} · ${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'}`,
    cover: group.cover,
    icon: <IconArtist />,
    onOpen: () => onOpenArtist(group.artist),
  }))

  return (
    <BrowseGrid
      title="Artists"
      countLabel={`${groups.length} ${groups.length === 1 ? 'artist' : 'artists'}`}
      items={items}
      hasSearch={hasSearch}
      emptyTitle="No artists yet"
      emptyMessage="Add music with artist tags to see artists here."
      emptyIcon={<IconArtist />}
    />
  )
}
