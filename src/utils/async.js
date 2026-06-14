export async function mapWithConcurrency(items, limit, fn) {
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      await fn(items[current], current)
    }
  })
  await Promise.all(workers)
}
