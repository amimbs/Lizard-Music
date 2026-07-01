import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReleaseNotesPopup } from './ReleaseNotesPopup.jsx'

const notes = {
  features: ['Pomodoro focus timer', 'Daily goal tracking'],
  fixes: ['Fixed update banner flicker'],
}

describe('ReleaseNotesPopup', () => {
  it('renders features and fixes sections with version title', () => {
    render(
      <ReleaseNotesPopup
        version="1.0.0-test"
        notes={notes}
        theme="dark"
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText("What's new in v1.0.0-test")).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Fixes')).toBeInTheDocument()
    expect(screen.getByText('Pomodoro focus timer')).toBeInTheDocument()
    expect(screen.getByText('Fixed update banner flicker')).toBeInTheDocument()
  })

  it('calls onDismiss when Got it is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <ReleaseNotesPopup
        version="1.0.0-test"
        notes={notes}
        theme="dark"
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Got it' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('omits empty sections', () => {
    render(
      <ReleaseNotesPopup
        version="1.0.0-test"
        notes={{ features: ['New playlist view'] }}
        theme="light"
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.queryByText('Fixes')).not.toBeInTheDocument()
  })
})
