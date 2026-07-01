import { describe, expect, it } from 'vitest'
import { getReleaseNotes, RELEASE_NOTES } from './releaseNotes.js'

describe('getReleaseNotes', () => {
  it('returns notes when the version has features or fixes', () => {
    const version = Object.keys(RELEASE_NOTES)[0]
    const notes = getReleaseNotes(version)

    expect(notes).toEqual(RELEASE_NOTES[version])
    expect(notes.features?.length || notes.fixes?.length).toBeGreaterThan(0)
  })

  it('returns null for an unknown version', () => {
    expect(getReleaseNotes('0.0.0-unknown')).toBeNull()
  })

  it('returns null when a version entry has no features or fixes', () => {
    RELEASE_NOTES['test-empty'] = { features: [], fixes: [] }
    expect(getReleaseNotes('test-empty')).toBeNull()
    delete RELEASE_NOTES['test-empty']
  })
})
