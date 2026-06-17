import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  IconHeart,
  IconHeartFilled,
  IconPlaylistAdd,
  IconEdit,
  IconTrash,
  IconMenu,
} from '../icons.jsx'
import { TRACK_MENU_WIDTH } from '../constants.js'
import { useFixedDropdown, useDropdownDismiss } from '../hooks/useDropdown.js'

export function TrackMenu({ isFavorite, removeLabel, onToggleFavorite, onAddToPlaylist, onEdit, onRemove }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const position = useFixedDropdown(open, triggerRef, menuRef, TRACK_MENU_WIDTH)
  useDropdownDismiss(open, setOpen, triggerRef, menuRef)

  const runAction = (action) => (e) => {
    e.stopPropagation()
    setOpen(false)
    action()
  }

  return (
    <div className={`track-menu ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="track-menu-trigger"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((value) => !value)
        }}
        aria-label="Song actions"
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
            style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${TRACK_MENU_WIDTH}px` }}
          >
            <button
              type="button"
              role="menuitem"
              className={`menu-item ${isFavorite ? 'active' : ''}`}
              onClick={runAction(onToggleFavorite)}
            >
              {isFavorite ? <IconHeartFilled /> : <IconHeart />}
              <span>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={runAction(onAddToPlaylist)}
            >
              <IconPlaylistAdd />
              <span>Add to playlist</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={runAction(onEdit)}
            >
              <IconEdit />
              <span>Edit</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="menu-item danger"
              onClick={runAction(onRemove)}
            >
              <IconTrash />
              <span>{removeLabel}</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
