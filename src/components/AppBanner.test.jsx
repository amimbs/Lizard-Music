import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppBanner } from './AppBanner.jsx'

describe('AppBanner', () => {
  it('shows error message and calls onDismiss', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(
      <AppBanner variant="error" message="Storage full" onDismiss={onDismiss} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Storage full')

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows install action and dismiss', async () => {
    const user = userEvent.setup()
    const onInstall = vi.fn()
    const onDismiss = vi.fn()

    render(
      <AppBanner
        variant="promo"
        title="Install Lizard Music"
        message="Add to your home screen for quick access."
        action={{ label: 'Install', onClick: onInstall }}
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Install' }))
    expect(onInstall).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows manual install hint without an action button', () => {
    render(
      <AppBanner
        variant="promo"
        title="Install this app"
        manualInstallHint
        onDismiss={() => {}}
      />,
    )

    expect(screen.getByText('Install this app')).toBeInTheDocument()
    expect(screen.getByText(/Install app/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })
})
