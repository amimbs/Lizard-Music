import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopBar } from './TopBar.jsx'

const defaultProps = {
  view: 'songs',
  setView: () => {},
  setSelectedPlaylistId: () => {},
  setSelectedAlbumKey: () => {},
  setSelectedArtist: () => {},
  setSelectedArtistAlbum: () => {},
  search: '',
  setSearch: () => {},
  selectedPlaylistId: null,
  selectedAlbumKey: null,
  selectedArtist: null,
  selectedArtistAlbum: null,
  fileInputRef: { current: null },
  folderInputRef: { current: null },
  onAddFiles: () => {},
  onDeleteLibrary: () => {},
  hasLibraryContent: false,
  theme: 'original',
  onThemeChange: () => {},
  onOpenPomodoro: () => {},
}

describe('TopBar', () => {
  it('opens the Pomodoro overlay when the lizard icon is clicked', async () => {
    const user = userEvent.setup()
    const onOpenPomodoro = vi.fn()

    render(<TopBar {...defaultProps} onOpenPomodoro={onOpenPomodoro} />)

    await user.click(screen.getByRole('button', { name: 'Pomodoro timer' }))
    expect(onOpenPomodoro).toHaveBeenCalledOnce()
  })
})
