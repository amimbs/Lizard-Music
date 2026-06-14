import { AUDIO_EXT } from '../constants.js'

export function isAudioFile(file) {
  const name = file.name.toLowerCase()
  if (file.type?.startsWith('audio/')) return true
  return AUDIO_EXT.some((ext) => name.endsWith(ext))
}

export function probeDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const duration = audio.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(duration) ? duration : 0)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(0)
    }
    audio.src = url
  })
}
