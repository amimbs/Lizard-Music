import { useState, useEffect, useCallback } from 'react'
import { TRACK_ROW_HEIGHT, TRACK_ROW_HEIGHT_MOBILE } from '../constants.js'

export function useRowHeight() {
  const [rowHeight, setRowHeight] = useState(TRACK_ROW_HEIGHT)

  useEffect(() => {
    const updateRowHeight = () => {
      setRowHeight(window.innerWidth <= 760 ? TRACK_ROW_HEIGHT_MOBILE : TRACK_ROW_HEIGHT)
    }
    updateRowHeight()
    window.addEventListener('resize', updateRowHeight)
    return () => window.removeEventListener('resize', updateRowHeight)
  }, [])

  const estimateRowSize = useCallback(() => rowHeight, [rowHeight])

  return { rowHeight, estimateRowSize }
}
