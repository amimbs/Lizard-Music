import { describe, expect, it, vi } from 'vitest'
import { sortByTitle, buildShuffleOrder } from './tracks.js'

function entry(title, artist, index = 0) {
  return { track: { title, artist }, index }
}

describe('sortByTitle', () => {
  it('sorts by title, then artist', () => {
    const items = [
      entry('Zebra', 'Band B', 2),
      entry('Alpha', 'Band B', 0),
      entry('Alpha', 'Band A', 1),
    ]

    const sorted = [...items].sort(sortByTitle)
    expect(sorted.map((i) => i.index)).toEqual([1, 0, 2])
  })
})

describe('buildShuffleOrder', () => {
  it('places excluded index first when provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const order = buildShuffleOrder([0, 1, 2, 3], 2)
    expect(order[0]).toBe(2)
    expect(order).toHaveLength(4)
    expect(new Set(order)).toEqual(new Set([0, 1, 2, 3]))
  })

  it('returns a shuffled copy when exclude is negative', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const order = buildShuffleOrder([0, 1, 2], -1)
    expect(order).toHaveLength(3)
    expect(new Set(order)).toEqual(new Set([0, 1, 2]))
  })
})
