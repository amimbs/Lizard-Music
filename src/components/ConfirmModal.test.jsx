import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from './ConfirmModal.jsx'

describe('ConfirmModal', () => {
  it('shows the message and focuses cancel by default', () => {
    render(
      <ConfirmModal
        title="Delete from library?"
        subtitle="Song · Artist"
        message="This permanently removes the song."
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('This permanently removes the song.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('calls onConfirm and onCancel', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmModal
        title="Delete?"
        message="Are you sure?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmModal
        title="Delete?"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('closes when clicking the overlay', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <ConfirmModal
        title="Delete playlist?"
        message="This removes the playlist only. All songs will stay in your library on this device."
        confirmLabel="Delete playlist"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('alertdialog').parentElement)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows playlist delete copy', () => {
    render(
      <ConfirmModal
        title="Delete playlist?"
        subtitle="Road Trip"
        message="This removes the playlist only. All songs will stay in your library on this device."
        confirmLabel="Delete playlist"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Delete playlist?' })).toBeInTheDocument()
    expect(screen.getByText('Road Trip')).toBeInTheDocument()
    expect(screen.getByText(/All songs will stay in your library/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete playlist' })).toBeInTheDocument()
  })
})
