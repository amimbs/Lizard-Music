import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  IconCheck,
  IconChevronRight,
  IconFile,
  IconFolder,
  IconMenu,
  IconPalette,
  IconTrash,
} from '../icons.jsx'
import { NAV_ADD_MENU_WIDTH } from '../constants.js'
import { APP_VERSION } from '../version.js'
import { THEMES } from '../themes.js'
import {
  useFixedDropdown,
  useDropdownDismiss,
  useSubmenuFlyout,
} from '../hooks/useDropdown.js'

const THEME_SUBMENU_WIDTH = NAV_ADD_MENU_WIDTH

export function NavAddMenu({
  onAddFiles,
  onAddFolder,
  onDeleteLibrary,
  hasLibraryContent,
  theme,
  onThemeChange,
}) {
  const [open, setOpen] = useState(false)
  const [themeSubOpen, setThemeSubOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const themeTriggerRef = useRef(null)
  const themeSubmenuRef = useRef(null)
  const position = useFixedDropdown(open, triggerRef, menuRef, NAV_ADD_MENU_WIDTH)
  const themeSubPosition = useSubmenuFlyout(
    open && themeSubOpen,
    themeTriggerRef,
    themeSubmenuRef,
    THEME_SUBMENU_WIDTH,
  )
  useDropdownDismiss(open, setOpen, triggerRef, menuRef, [themeSubmenuRef])

  const runAction = (action) => (e) => {
    e.stopPropagation()
    setOpen(false)
    setThemeSubOpen(false)
    action()
  }

  const toggleThemeSubmenu = (e) => {
    e.stopPropagation()
    setThemeSubOpen((value) => !value)
  }

  const selectTheme = (themeId) => (e) => {
    e.stopPropagation()
    onThemeChange(themeId)
    setThemeSubOpen(false)
  }

  const handleMenuToggle = () => {
    setOpen((value) => {
      if (value) setThemeSubOpen(false)
      return !value
    })
  }

  return (
    <div className={`nav-menu ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="nav-menu-trigger"
        onClick={handleMenuToggle}
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
            <button
              ref={themeTriggerRef}
              type="button"
              role="menuitem"
              className={`menu-item has-submenu${themeSubOpen ? ' open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={themeSubOpen}
              onClick={toggleThemeSubmenu}
            >
              <span className="menu-item-label">
                <IconPalette />
                <span>Theme</span>
              </span>
              <span className="menu-item-chevron" aria-hidden="true">
                <IconChevronRight />
              </span>
            </button>
            <div className="menu-divider" role="separator" />
            <div className="menu-version" aria-label={`Version ${APP_VERSION}`}>
              v{APP_VERSION}
            </div>
          </div>,
          document.body,
        )}
      {open &&
        themeSubOpen &&
        createPortal(
          <div
            ref={themeSubmenuRef}
            className="menu-dropdown menu-submenu-flyout"
            role="menu"
            aria-label="Theme options"
            style={{
              top: `${themeSubPosition.top}px`,
              left: `${themeSubPosition.left}px`,
              width: `${THEME_SUBMENU_WIDTH}px`,
            }}
          >
            {THEMES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === id}
                className={`menu-item menu-theme-option${theme === id ? ' active' : ''}`}
                onClick={selectTheme(id)}
              >
                <span>{label}</span>
                <span className="menu-theme-check" aria-hidden="true">
                  <IconCheck />
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
