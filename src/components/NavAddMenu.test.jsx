import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavAddMenu } from './NavAddMenu.jsx'
import { APP_VERSION } from '../version.js'

const defaultProps = {
  onAddFiles: () => {},
  onAddFolder: () => {},
  onDeleteLibrary: () => {},
  hasLibraryContent: false,
  theme: 'original',
  onThemeChange: () => {},
}

describe('NavAddMenu', () => {
  it('offers delete library when the library has content', async () => {
    const user = userEvent.setup()
    const onDeleteLibrary = vi.fn()

    render(
      <NavAddMenu
        {...defaultProps}
        onDeleteLibrary={onDeleteLibrary}
        hasLibraryContent
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Library menu' }))
    await user.click(screen.getByRole('menuitem', { name: /Delete library/i }))

    expect(onDeleteLibrary).toHaveBeenCalledOnce()
  })

  it('disables delete library when the library is empty', async () => {
    const user = userEvent.setup()

    render(<NavAddMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Library menu' }))

    expect(screen.getByRole('menuitem', { name: /Delete library/i })).toBeDisabled()
  })

  it('shows the app version in the menu', async () => {
    const user = userEvent.setup()

    render(<NavAddMenu {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Library menu' }))

    expect(screen.getByLabelText(`Version ${APP_VERSION}`)).toHaveTextContent(`v${APP_VERSION}`)
  })

  it('opens the theme flyout and selects warm', async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()

    render(<NavAddMenu {...defaultProps} onThemeChange={onThemeChange} />)

    await user.click(screen.getByRole('button', { name: 'Library menu' }))
    await user.click(screen.getByRole('menuitem', { name: /Theme/i }))

    expect(screen.getByRole('menu', { name: 'Theme options' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitemradio', { name: 'Warm' }))

    expect(onThemeChange).toHaveBeenCalledWith('warm')
  })

  it('shows a checkmark on the active theme', async () => {
    const user = userEvent.setup()

    render(<NavAddMenu {...defaultProps} theme="warm" />)

    await user.click(screen.getByRole('button', { name: 'Library menu' }))
    await user.click(screen.getByRole('menuitem', { name: /Theme/i }))

    expect(screen.getByRole('menuitemradio', { name: 'Warm' })).toHaveClass('active')
    expect(screen.getByRole('menuitemradio', { name: 'Original' })).not.toHaveClass('active')
  })
})
