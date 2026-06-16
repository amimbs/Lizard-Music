import { useState, useEffect, useLayoutEffect } from 'react'

export function useFixedDropdown(open, triggerRef, menuRef, menuWidth) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuHeight = menuRef.current?.offsetHeight ?? 100
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12
      const top = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6
      const left = Math.max(
        8,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
      )

      setPosition({ top, left })
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, menuWidth, triggerRef, menuRef])

  return position
}

export function useDropdownDismiss(open, setOpen, triggerRef, menuRef, extraRefs = []) {
  useEffect(() => {
    if (!open) return

    const isInsideMenu = (target) =>
      triggerRef.current?.contains(target) ||
      menuRef.current?.contains(target) ||
      extraRefs.some((ref) => ref.current?.contains(target))

    const handlePointerDown = (e) => {
      if (isInsideMenu(e.target)) return
      setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (extraRefs.some((ref) => ref.current?.contains(e.target))) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, setOpen, triggerRef, menuRef, extraRefs])
}

export function useSubmenuFlyout(open, anchorRef, submenuRef, submenuWidth) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const submenuHeight = submenuRef.current?.offsetHeight ?? 120
      const gap = 4
      let left = rect.right + gap
      if (left + submenuWidth > window.innerWidth - 8) {
        left = Math.max(8, rect.left - submenuWidth - gap)
      }

      let top = rect.top
      if (top + submenuHeight > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - submenuHeight - 8)
      }

      setPosition({ top, left })
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, submenuWidth, anchorRef, submenuRef])

  return position
}
