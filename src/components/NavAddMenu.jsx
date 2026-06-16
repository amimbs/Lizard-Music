import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconFile, IconFolder, IconMenu, IconTrash } from '../icons.jsx'
import { NAV_ADD_MENU_WIDTH } from '../constants.js'
import { APP_VERSION } from '../version.js'
import { useFixedDropdown, useDropdownDismiss } from '../hooks/useDropdown.js'

export function NavAddMenu({ onAddFiles, onAddFolder, onDeleteLibrary, hasLibraryContent }) {
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
        aria-label="Library menu"
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
            <div className="menu-divider" role="separator" />
            <button
              type="button"
              role="menuitem"
              className="menu-item danger"
              disabled={!hasLibraryContent}
              onClick={runAction(onDeleteLibrary)}
            >
              <IconTrash />
              <span>Delete library</span>
            </button>
            <div className="menu-divider" role="separator" />
            <div className="menu-version" aria-label={`Version ${APP_VERSION}`}>
              v{APP_VERSION}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
