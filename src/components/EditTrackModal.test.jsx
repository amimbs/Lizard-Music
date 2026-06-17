import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditTrackModal } from './EditTrackModal.jsx'

const track = {
  id: 't1',
  title: 'Original Title',
  artist: 'Original Artist',
  album: 'Original Album',
}

describe('EditTrackModal', () => {
  it('disables Save when title is blank', async () => {
    const user = userEvent.setup()
    render(<EditTrackModal track={track} onSave={vi.fn()} onClose={vi.fn()} />)

    const titleInput = screen.getByLabelText('Title')
    await user.clear(titleInput)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('submits trimmed metadata values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<EditTrackModal track={track} onSave={onSave} onClose={vi.fn()} />)

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), '  New Title  ')
    await user.clear(screen.getByLabelText('Artist'))
    await user.type(screen.getByLabelText('Artist'), '  New Artist  ')
    await user.clear(screen.getByLabelText('Album'))
    await user.type(screen.getByLabelText('Album'), '  New Album  ')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith({
      title: 'New Title',
      artist: '  New Artist  ',
      album: '  New Album  ',
    })
  })
})
