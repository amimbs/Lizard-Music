import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { isQuotaError, trackToRecord } from './libraryDb.js'

describe('isQuotaError', () => {
  it('detects quota errors by name or code', () => {
    expect(isQuotaError({ name: 'QuotaExceededError' })).toBe(true)
    expect(isQuotaError({ code: 22 })).toBe(true)
    expect(isQuotaError({ code: 1014 })).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isQuotaError({ name: 'NotFoundError' })).toBe(false)
    expect(isQuotaError(null)).toBe(false)
    expect(isQuotaError(undefined)).toBe(false)
  })
})

describe('trackToRecord', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps track fields to a persisted record', () => {
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })
    const coverBlob = new Blob(['cover'], { type: 'image/jpeg' })

    const record = trackToRecord({
      id: 'track-1',
      file,
      title: 'Song Title',
      artist: 'Artist Name',
      album: 'Album Name',
      duration: 180,
      coverBlob,
      coverMime: 'image/jpeg',
      addedAt: 1000,
      favorite: true,
    })

    expect(record).toEqual({
      id: 'track-1',
      fileName: 'song.mp3',
      mimeType: 'audio/mpeg',
      audioBlob: file,
      title: 'Song Title',
      artist: 'Artist Name',
      album: 'Album Name',
      duration: 180,
      coverBlob,
      coverMime: 'image/jpeg',
      addedAt: 1000,
      favorite: true,
      metadataEdited: false,
    })
  })

  it('fills defaults for optional fields', () => {
    const file = new File(['audio'], 'untitled.mp3', { type: '' })

    const record = trackToRecord({
      id: 'track-2',
      file,
      title: 'Untitled',
      artist: 'Unknown',
      duration: 0,
    })

    expect(record.mimeType).toBe('audio/mpeg')
    expect(record.album).toBe('Unknown album')
    expect(record.coverBlob).toBeNull()
    expect(record.coverMime).toBeNull()
    expect(record.addedAt).toBe(Date.parse('2026-01-15T12:00:00Z'))
    expect(record.favorite).toBe(false)
  })

  it('persists metadataEdited when set', () => {
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mpeg' })

    const record = trackToRecord({
      id: 'track-3',
      file,
      title: 'Edited Title',
      artist: 'Edited Artist',
      album: 'Edited Album',
      duration: 120,
      metadataEdited: true,
    })

    expect(record.metadataEdited).toBe(true)
  })
})
