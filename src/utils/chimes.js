export const CHIME_PROFILES = {
  pomodoroEnd: {
    id: 'pomodoroEnd',
    notes: [
      { frequency: 440, duration: 0.15, gap: 0.05 },
      { frequency: 660, duration: 0.25, gap: 0 },
    ],
  },
  shortRestEnd: {
    id: 'shortRestEnd',
    notes: [{ frequency: 523, duration: 0.35, gap: 0 }],
  },
  longRestEnd: {
    id: 'longRestEnd',
    notes: [
      { frequency: 660, duration: 0.12, gap: 0.04 },
      { frequency: 523, duration: 0.12, gap: 0.04 },
      { frequency: 440, duration: 0.3, gap: 0 },
    ],
  },
}

const DUCK_RATIO = 0.25

export function createChimePlayer({ getAudioElement, getVolume, getMuted }) {
  let audioContext = null

  const ensureContext = () => {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    return audioContext
  }

  const playNote = (ctx, { frequency, duration, gap }) =>
    new Promise((resolve) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.value = 0.25
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      const now = ctx.currentTime
      oscillator.start(now)
      oscillator.stop(now + duration)
      oscillator.onended = () => {
        setTimeout(resolve, gap * 1000)
      }
    })

  const playProfile = async (profile) => {
    const ctx = ensureContext()
    for (const note of profile.notes) {
      await playNote(ctx, note)
    }
  }

  const playChime = async (type) => {
    const profile = CHIME_PROFILES[type]
    if (!profile) return

    const audio = getAudioElement()
    const muted = getMuted()
    const userVolume = getVolume()
    let savedVolume = null

    if (audio && !muted) {
      savedVolume = audio.volume
      audio.volume = userVolume * DUCK_RATIO
    }

    try {
      await playProfile(profile)
    } finally {
      if (audio && !muted && savedVolume !== null) {
        audio.volume = savedVolume
      }
    }
  }

  return { playChime }
}
