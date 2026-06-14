import { describe, expect, it } from 'vitest'
import { formatTime, prettyName } from './format.js'

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(125)).toBe('2:05')
  })

  it('returns 0:00 for falsy or NaN values', () => {
    expect(formatTime(null)).toBe('0:00')
    expect(formatTime(undefined)).toBe('0:00')
    expect(formatTime(NaN)).toBe('0:00')
  })

  it('floors fractional seconds', () => {
    expect(formatTime(90.9)).toBe('1:30')
  })
})

describe('prettyName', () => {
  it('strips extension and replaces underscores', () => {
    expect(prettyName('my_song.mp3')).toBe('my song')
    expect(prettyName('Artist - Track.flac')).toBe('Artist - Track')
  })
})
