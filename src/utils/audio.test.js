import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { isAudioFile, probeDuration } from './audio.js'

function makeFile(name, type = '') {
  return new File([''], name, { type })
}

describe('isAudioFile', () => {
  it('accepts files with audio MIME type', () => {
    expect(isAudioFile(makeFile('track.bin', 'audio/mpeg'))).toBe(true)
  })

  it('accepts known audio extensions when MIME is missing', () => {
    expect(isAudioFile(makeFile('song.mp3'))).toBe(true)
    expect(isAudioFile(makeFile('song.FLAC'))).toBe(true)
    expect(isAudioFile(makeFile('song.ogg'))).toBe(true)
  })

  it('rejects non-audio files', () => {
    expect(isAudioFile(makeFile('readme.txt', 'text/plain'))).toBe(false)
    expect(isAudioFile(makeFile('cover.jpg', 'image/jpeg'))).toBe(false)
  })
})

describe('probeDuration', () => {
  const createObjectURL = vi.fn(() => 'blob:test')
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  it('resolves duration from audio metadata', async () => {
    class MockAudio {
      preload = ''
      duration = 212.5
      onloadedmetadata = null
      onerror = null

      set src(_value) {
        this.onloadedmetadata?.()
      }
    }

    vi.stubGlobal('Audio', MockAudio)

    const duration = await probeDuration(makeFile('song.mp3', 'audio/mpeg'))
    expect(duration).toBe(212.5)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('resolves 0 when metadata fails to load', async () => {
    class MockAudio {
      preload = ''
      onloadedmetadata = null
      onerror = null

      set src(_value) {
        this.onerror?.()
      }
    }

    vi.stubGlobal('Audio', MockAudio)

    const duration = await probeDuration(makeFile('bad.mp3', 'audio/mpeg'))
    expect(duration).toBe(0)
  })
})
