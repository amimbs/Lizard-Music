import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconFile, IconFolder, IconMenu } from '../icons.jsx'
import { NAV_ADD_MENU_WIDTH } from '../constants.js'
import { useFixedDropdown, useDropdownDismiss } from '../hooks/useDropdown.js'

export function NavAddMenu({ onAddFiles, onAddFolder }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const position = useFixedDropdown(open, triggerRef, menuRef, NAV_ADD_MENU_WIDTH)
  useDropdownDismiss(open, setOpen, triggerRef, menuRef)

  const runAction = (action) => (e) => {
    e.stopPropagation()
    setOpen(false)
    action()
  }

  return (
    <div className={`nav-menu ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="nav-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label="Add music"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconMenu />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="menu-dropdown"
            role="menu"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${NAV_ADD_MENU_WIDTH}px`,
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="menu-item primary"
              onClick={runAction(onAddFiles)}
            >
              <IconFile />
              <span>Add files</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={runAction(onAddFolder)}
            >
              <IconFolder />
              <span>Add folder</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
