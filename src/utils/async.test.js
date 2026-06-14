import { describe, expect, it, vi } from 'vitest'
import { mapWithConcurrency } from './async.js'

describe('mapWithConcurrency', () => {
  it('maps all items with the given concurrency limit', async () => {
    const items = [1, 2, 3, 4, 5]
    const results = []

    await mapWithConcurrency(items, 2, async (item, index) => {
      results.push({ item, index })
    })

    expect(results).toHaveLength(5)
    expect(results.map((r) => r.item).sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('does nothing for an empty list', async () => {
    const fn = vi.fn()
    await mapWithConcurrency([], 3, fn)
    expect(fn).not.toHaveBeenCalled()
  })

  it('respects the concurrency limit', async () => {
    let active = 0
    let maxActive = 0
    const items = Array.from({ length: 8 }, (_, i) => i)

    await mapWithConcurrency(items, 3, async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 10))
      active -= 1
    })

    expect(maxActive).toBeLessThanOrEqual(3)
  })
})
