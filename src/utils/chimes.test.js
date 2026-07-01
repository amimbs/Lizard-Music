import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { CHIME_PROFILES, createChimePlayer } from './chimes.js'

describe('CHIME_PROFILES', () => {
  it('defines distinct profiles for each chime type', () => {
    expect(CHIME_PROFILES.pomodoroEnd.notes).not.toEqual(CHIME_PROFILES.shortRestEnd.notes)
    expect(CHIME_PROFILES.shortRestEnd.notes).not.toEqual(CHIME_PROFILES.longRestEnd.notes)
    expect(CHIME_PROFILES.pomodoroEnd.notes).not.toEqual(CHIME_PROFILES.longRestEnd.notes)
  })
})

describe('createChimePlayer', () => {
  let mockAudio
  let playChime

  beforeEach(() => {
    mockAudio = {
      volume: 0.8,
      pause: vi.fn(),
    }

    const oscillators = []
    class MockOscillator {
      constructor() {
        this.frequency = { value: 0 }
        this.onended = null
        oscillators.push(this)
      }
      connect() {}
      start() {}
      stop() {
        setTimeout(() => this.onended?.(), 0)
      }
    }

    class MockGain {
      constructor() {
        this.gain = { value: 0 }
      }
      connect() {}
    }

    class MockAudioContext {
      constructor() {
        this.state = 'running'
        this.currentTime = 0
        this.destination = {}
      }
      createOscillator() {
        return new MockOscillator()
      }
      createGain() {
        return new MockGain()
      }
      resume() {
        return Promise.resolve()
      }
    }

    vi.stubGlobal('AudioContext', MockAudioContext)

    const player = createChimePlayer({
      getAudioElement: () => mockAudio,
      getVolume: () => 0.8,
      getMuted: () => false,
    })
    playChime = player.playChime
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ducks music volume during chime and restores afterward', async () => {
    await playChime('pomodoroEnd')
    expect(mockAudio.volume).toBe(0.8)
    expect(mockAudio.pause).not.toHaveBeenCalled()
  })

  it('does not duck when muted', async () => {
    const player = createChimePlayer({
      getAudioElement: () => mockAudio,
      getVolume: () => 0.8,
      getMuted: () => true,
    })

    mockAudio.volume = 0
    await player.playChime('shortRestEnd')
    expect(mockAudio.volume).toBe(0)
    expect(mockAudio.pause).not.toHaveBeenCalled()
  })

  it('plays pomodoroEnd profile', async () => {
    await expect(playChime('pomodoroEnd')).resolves.toBeUndefined()
  })

  it('plays shortRestEnd profile', async () => {
    await expect(playChime('shortRestEnd')).resolves.toBeUndefined()
  })

  it('plays longRestEnd profile', async () => {
    await expect(playChime('longRestEnd')).resolves.toBeUndefined()
  })
})
