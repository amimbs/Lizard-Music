import { describe, expect, it } from 'vitest'
import {
  validatePomodoroMinutes,
  validateShortRestMinutes,
  validateLongRestMinutes,
  validateAllDurations,
  POMODORO_MIN,
  POMODORO_MAX,
  SHORT_REST_MIN,
  SHORT_REST_MAX,
  LONG_REST_MIN,
  LONG_REST_MAX,
} from './pomodoroValidation.js'

describe('validatePomodoroMinutes', () => {
  it('allows 5–60 minutes only', () => {
    expect(validatePomodoroMinutes(POMODORO_MIN)).toBe(true)
    expect(validatePomodoroMinutes(POMODORO_MAX)).toBe(true)
    expect(validatePomodoroMinutes(25)).toBe(true)
    expect(validatePomodoroMinutes(POMODORO_MIN - 1)).toBe(false)
    expect(validatePomodoroMinutes(POMODORO_MAX + 1)).toBe(false)
    expect(validatePomodoroMinutes(25.5)).toBe(false)
    expect(validatePomodoroMinutes('25')).toBe(false)
    expect(validatePomodoroMinutes(NaN)).toBe(false)
  })
})

describe('validateShortRestMinutes', () => {
  it('allows 5–30 minutes only', () => {
    expect(validateShortRestMinutes(SHORT_REST_MIN)).toBe(true)
    expect(validateShortRestMinutes(SHORT_REST_MAX)).toBe(true)
    expect(validateShortRestMinutes(SHORT_REST_MIN - 1)).toBe(false)
    expect(validateShortRestMinutes(SHORT_REST_MAX + 1)).toBe(false)
    expect(validateShortRestMinutes(10.5)).toBe(false)
  })
})

describe('validateLongRestMinutes', () => {
  it('allows 15–60 minutes only', () => {
    expect(validateLongRestMinutes(LONG_REST_MIN)).toBe(true)
    expect(validateLongRestMinutes(LONG_REST_MAX)).toBe(true)
    expect(validateLongRestMinutes(LONG_REST_MIN - 1)).toBe(false)
    expect(validateLongRestMinutes(LONG_REST_MAX + 1)).toBe(false)
    expect(validateLongRestMinutes(20.5)).toBe(false)
  })
})

describe('validateAllDurations', () => {
  it('returns valid for all in-range values', () => {
    const result = validateAllDurations({ pomodoro: 25, shortRest: 5, longRest: 15 })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('returns errors for each invalid field', () => {
    const result = validateAllDurations({ pomodoro: 4, shortRest: 31, longRest: 14 })
    expect(result.valid).toBe(false)
    expect(result.errors.pomodoro).toBeDefined()
    expect(result.errors.shortRest).toBeDefined()
    expect(result.errors.longRest).toBeDefined()
  })
})
