export function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function prettyName(filename) {
  return filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
}
