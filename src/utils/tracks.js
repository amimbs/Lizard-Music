export function sortByTitle(a, b) {
  const titleCmp = a.track.title.toLowerCase().localeCompare(b.track.title.toLowerCase())
  if (titleCmp !== 0) return titleCmp
  return a.track.artist.toLowerCase().localeCompare(b.track.artist.toLowerCase())
}

export function buildShuffleOrder(order, exclude) {
  const shuffled = order.filter((i) => i !== exclude)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return exclude >= 0 ? [exclude, ...shuffled] : shuffled
}
