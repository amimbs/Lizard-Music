import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavAddMenu } from './NavAddMenu.jsx'

describe('NavAddMenu', () => {
  it('offers delete library when the library has content', async () => {
    const user = userEvent.setup()
    const onDeleteLibrary = vi.fn()

    render(
      <NavAddMenu
        onAddFiles={() => {}}
        onAddFolder={() => {}}
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

    render(
      <NavAddMenu
        onAddFiles={() => {}}
        onAddFolder={() => {}}
        onDeleteLibrary={() => {}}
        hasLibraryContent={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Library menu' }))

    expect(screen.getByRole('menuitem', { name: /Delete library/i })).toBeDisabled()
  })
})
