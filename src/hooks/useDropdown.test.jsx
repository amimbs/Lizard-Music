import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { useDropdownDismiss } from './useDropdown.js'

function TestDropdown() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  useDropdownDismiss(open, setOpen, triggerRef, menuRef)

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open menu
      </button>
      {open && (
        <div ref={menuRef} role="menu">
          Menu item
        </div>
      )}
      <button type="button">Outside</button>
      <div data-testid="scroll-area">Scrollable list</div>
    </div>
  )
}

describe('useDropdownDismiss', () => {
  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup()
    render(<TestDropdown />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes when scrolling outside the menu', async () => {
    const user = userEvent.setup()
    render(<TestDropdown />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.scroll(screen.getByTestId('scroll-area'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
