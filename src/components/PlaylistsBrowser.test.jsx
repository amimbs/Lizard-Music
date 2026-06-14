import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaylistsBrowser } from './PlaylistsBrowser.jsx'

const playlists = [
  { id: 'p1', name: 'Road Trip', trackIds: ['t1', 't2'] },
  { id: 'p2', name: 'Chill', trackIds: ['t3'] },
]

describe('PlaylistsBrowser', () => {
  it('requests playlist deletion instead of deleting immediately', async () => {
    const user = userEvent.setup()
    const onDeletePlaylist = vi.fn()

    render(
      <PlaylistsBrowser
        playlists={playlists}
        newPlaylistName=""
        onNewPlaylistNameChange={() => {}}
        onCreatePlaylist={() => {}}
        onOpenPlaylist={() => {}}
        onDeletePlaylist={onDeletePlaylist}
        hasSearch={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete Road Trip' }))

    expect(onDeletePlaylist).toHaveBeenCalledOnce()
    expect(onDeletePlaylist).toHaveBeenCalledWith('p1')
  })

  it('opens a playlist when its card is clicked', async () => {
    const user = userEvent.setup()
    const onOpenPlaylist = vi.fn()

    const { container } = render(
      <PlaylistsBrowser
        playlists={playlists}
        newPlaylistName=""
        onNewPlaylistNameChange={() => {}}
        onCreatePlaylist={() => {}}
        onOpenPlaylist={onOpenPlaylist}
        onDeletePlaylist={() => {}}
        hasSearch={false}
      />,
    )

    await user.click(container.querySelector('.playlist-card'))

    expect(onOpenPlaylist).toHaveBeenCalledWith('p1')
  })
})
